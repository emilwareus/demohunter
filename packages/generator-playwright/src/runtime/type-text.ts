import type { TypeTextOptions, TypeTextPace } from "@demohunter/sdk";
import type { Locator } from "playwright";

type ResolvedTypeTextPace = {
  minDelayMs: number;
  maxDelayMs: number;
  spacePauseMs: number;
  punctuationPauseMs: number;
};

type SegmenterConstructor = new (
  locale: string | string[] | undefined,
  options: { granularity: "grapheme" },
) => {
  segment(input: string): Iterable<{ segment: string }>;
};

type IntlWithSegmenter = typeof Intl & {
  Segmenter?: SegmenterConstructor;
};

export type ResolvedTypeTextAction = {
  delaysMs: number[];
  options?: TypeTextOptions;
  text: string;
  units: string[];
};

const BUILT_IN_PACES = {
  fast: {
    maxDelayMs: 65,
    minDelayMs: 25,
    punctuationPauseMs: 90,
    spacePauseMs: 35,
  },
  natural: {
    maxDelayMs: 145,
    minDelayMs: 55,
    punctuationPauseMs: 180,
    spacePauseMs: 90,
  },
  slow: {
    maxDelayMs: 230,
    minDelayMs: 95,
    punctuationPauseMs: 300,
    spacePauseMs: 150,
  },
} satisfies Record<Exclude<TypeTextPace, object>, ResolvedTypeTextPace>;

export async function typeTextIntoLocator(
  target: Locator,
  text: string,
  options: TypeTextOptions | undefined,
  sleep: (durationMs: number) => Promise<void>,
  onResolvedAction?: (action: ResolvedTypeTextAction) => void,
): Promise<void> {
  const action = resolveTypeTextAction(text, options);
  const timeoutOptions =
    action.options?.timeoutMs === undefined ? undefined : { timeout: action.options.timeoutMs };
  onResolvedAction?.(action);

  if (action.options?.replace === true) {
    await press(target, "ControlOrMeta+A", timeoutOptions);
    await press(target, "Backspace", timeoutOptions);
  }

  for (const [index, unit] of action.units.entries()) {
    await pressSequentially(target, unit, timeoutOptions);

    const delayMs = action.delaysMs[index];

    if (delayMs !== undefined && delayMs > 0) {
      await sleep(delayMs);
    }
  }
}

export function resolveTypeTextAction(text: unknown, options: unknown): ResolvedTypeTextAction {
  assertString("typeText text", text);

  const normalizedOptions = normalizeTypeTextOptions(options);
  const pace = resolveTypeTextPace(normalizedOptions?.pace);
  const units = splitTextIntoUnits(text);
  const seed = normalizedOptions?.seed ?? text;
  const delaysMs = units.slice(0, -1).map((unit, index) => resolveDelayMs(pace, seed, unit, index));

  return {
    delaysMs,
    options: normalizedOptions,
    text,
    units,
  };
}

function normalizeTypeTextOptions(options: unknown): TypeTextOptions | undefined {
  if (options === undefined) {
    return undefined;
  }

  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("typeText options must be an object when provided.");
  }

  const input = options as Partial<TypeTextOptions>;
  const normalized: TypeTextOptions = {};

  if (input.replace !== undefined) {
    if (typeof input.replace !== "boolean") {
      throw new Error(
        `typeText replace must be a boolean when provided: ${formatUnknownValue(input.replace)}`,
      );
    }

    normalized.replace = input.replace;
  }

  if (input.pace !== undefined) {
    normalized.pace = cloneTypeTextPace(input.pace);
  }

  if (input.seed !== undefined) {
    if (typeof input.seed !== "string" && typeof input.seed !== "number") {
      throw new Error(
        `typeText seed must be a string or number when provided: ${formatUnknownValue(input.seed)}`,
      );
    }

    normalized.seed = input.seed;
  }

  assertNonNegativeFiniteNumber("typeText timeoutMs", input.timeoutMs);

  if (input.timeoutMs !== undefined) {
    normalized.timeoutMs = input.timeoutMs;
  }

  return normalized;
}

function resolveTypeTextPace(pace: unknown): ResolvedTypeTextPace {
  if (pace === undefined) {
    return BUILT_IN_PACES.natural;
  }

  if (isBuiltInPaceName(pace)) {
    return BUILT_IN_PACES[pace];
  }

  if (typeof pace === "string") {
    throw new Error(`typeText pace must be "fast", "natural", "slow", or a custom pace object.`);
  }

  if (pace === null || typeof pace !== "object") {
    throw new Error(`typeText pace must be "fast", "natural", "slow", or a custom pace object.`);
  }

  const customPace = pace as Partial<Extract<TypeTextPace, object>>;

  assertRequiredNonNegativeFiniteNumber("typeText pace.minDelayMs", customPace.minDelayMs);
  assertRequiredNonNegativeFiniteNumber("typeText pace.maxDelayMs", customPace.maxDelayMs);
  assertNonNegativeFiniteNumber("typeText pace.spacePauseMs", customPace.spacePauseMs);
  assertNonNegativeFiniteNumber("typeText pace.punctuationPauseMs", customPace.punctuationPauseMs);

  if (customPace.minDelayMs > customPace.maxDelayMs) {
    throw new Error(
      `typeText pace.minDelayMs must be less than or equal to pace.maxDelayMs: ${customPace.minDelayMs} > ${customPace.maxDelayMs}`,
    );
  }

  return {
    maxDelayMs: customPace.maxDelayMs,
    minDelayMs: customPace.minDelayMs,
    punctuationPauseMs: customPace.punctuationPauseMs ?? 0,
    spacePauseMs: customPace.spacePauseMs ?? 0,
  };
}

function isBuiltInPaceName(pace: unknown): pace is keyof typeof BUILT_IN_PACES {
  return pace === "fast" || pace === "natural" || pace === "slow";
}

function cloneTypeTextPace(pace: TypeTextPace): TypeTextPace {
  if (isBuiltInPaceName(pace)) {
    return pace;
  }

  if (pace === null || typeof pace !== "object") {
    return pace;
  }

  return { ...pace };
}

function resolveDelayMs(
  pace: ResolvedTypeTextPace,
  seed: string | number,
  unit: string,
  index: number,
): number {
  const spanMs = pace.maxDelayMs - pace.minDelayMs;
  const jitterMs = spanMs === 0 ? 0 : Math.round(deterministicFraction(`${seed}:${index}:${unit}`) * spanMs);
  const extraPauseMs = resolveExtraPauseMs(pace, unit);

  return pace.minDelayMs + jitterMs + extraPauseMs;
}

function resolveExtraPauseMs(pace: ResolvedTypeTextPace, unit: string): number {
  if (/^\s$/u.test(unit)) {
    return pace.spacePauseMs;
  }

  if (/^[,.;:!?]$/u.test(unit)) {
    return pace.punctuationPauseMs;
  }

  return 0;
}

function deterministicFraction(input: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0) / 4_294_967_295;
}

function splitTextIntoUnits(text: string): string[] {
  const Segmenter = (Intl as IntlWithSegmenter).Segmenter;

  if (Segmenter !== undefined) {
    return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }

  return Array.from(text);
}

function assertString(name: string, value: unknown): asserts value is string {
  if (typeof value === "string") {
    return;
  }

  throw new Error(`${name} must be a string: ${formatUnknownValue(value)}`);
}

async function press(
  target: Locator,
  key: string,
  options: { timeout: number } | undefined,
): Promise<void> {
  if (options === undefined) {
    await target.press(key);
    return;
  }

  await target.press(key, options);
}

async function pressSequentially(
  target: Locator,
  text: string,
  options: { timeout: number } | undefined,
): Promise<void> {
  if (options === undefined) {
    await target.pressSequentially(text);
    return;
  }

  await target.pressSequentially(text, options);
}

function assertNonNegativeFiniteNumber(name: string, value: unknown): void {
  if (value === undefined) {
    return;
  }

  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return;
  }

  throw new Error(`${name} must be a non-negative finite number: ${formatUnknownValue(value)}`);
}

function assertRequiredNonNegativeFiniteNumber(
  name: string,
  value: unknown,
): asserts value is number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return;
  }

  throw new Error(`${name} must be a non-negative finite number: ${formatUnknownValue(value)}`);
}

function formatUnknownValue(value: unknown): string {
  if (typeof value === "symbol") {
    return value.toString();
  }

  if (typeof value === "function") {
    return `[function ${value.name || "anonymous"}]`;
  }

  try {
    return String(value);
  } catch {
    try {
      return Object.prototype.toString.call(value);
    } catch {
      return "[unformattable value]";
    }
  }
}
