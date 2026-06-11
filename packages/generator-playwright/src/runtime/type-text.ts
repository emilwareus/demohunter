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
): Promise<void> {
  const pace = resolveTypeTextPace(options?.pace);
  const units = splitTextIntoUnits(text);
  const timeoutOptions = options?.timeoutMs === undefined ? undefined : { timeout: options.timeoutMs };
  const seed = options?.seed ?? text;

  assertNonNegativeFiniteNumber("typeText timeoutMs", options?.timeoutMs);

  if (options?.replace === true) {
    await press(target, "ControlOrMeta+A", timeoutOptions);
    await press(target, "Backspace", timeoutOptions);
  }

  for (const [index, unit] of units.entries()) {
    await pressSequentially(target, unit, timeoutOptions);

    if (index === units.length - 1) {
      continue;
    }

    const delayMs = resolveDelayMs(pace, seed, unit, index);

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }
}

function resolveTypeTextPace(pace: TypeTextOptions["pace"]): ResolvedTypeTextPace {
  if (pace === undefined) {
    return BUILT_IN_PACES.natural;
  }

  if (typeof pace === "string") {
    const resolved = BUILT_IN_PACES[pace];

    if (resolved === undefined) {
      throw new Error(`typeText pace must be "fast", "natural", "slow", or a custom pace object.`);
    }

    return resolved;
  }

  assertNonNegativeFiniteNumber("typeText pace.minDelayMs", pace.minDelayMs);
  assertNonNegativeFiniteNumber("typeText pace.maxDelayMs", pace.maxDelayMs);
  assertNonNegativeFiniteNumber("typeText pace.spacePauseMs", pace.spacePauseMs);
  assertNonNegativeFiniteNumber("typeText pace.punctuationPauseMs", pace.punctuationPauseMs);

  if (pace.minDelayMs > pace.maxDelayMs) {
    throw new Error(
      `typeText pace.minDelayMs must be less than or equal to pace.maxDelayMs: ${pace.minDelayMs} > ${pace.maxDelayMs}`,
    );
  }

  return {
    maxDelayMs: pace.maxDelayMs,
    minDelayMs: pace.minDelayMs,
    punctuationPauseMs: pace.punctuationPauseMs ?? 0,
    spacePauseMs: pace.spacePauseMs ?? 0,
  };
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

function assertNonNegativeFiniteNumber(name: string, value: number | undefined): void {
  if (value === undefined) {
    return;
  }

  if (Number.isFinite(value) && value >= 0) {
    return;
  }

  throw new Error(`${name} must be a non-negative finite number: ${value}`);
}
