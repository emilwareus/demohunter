import type { HighlightStyle } from "@demohunter/sdk";
import type { Locator, Page } from "playwright";

export type ApplyHighlightVisualInput = {
  page: Page;
  target: Locator;
  style: HighlightStyle;
  paddingPx: number;
  durationMs: number;
  /** Injectable wait used between showing and clearing the highlight (defaults to page.waitForTimeout). */
  waitForTimeout?: (page: Page, durationMs: number) => Promise<void>;
};

const ringStyle = (paddingPx: number): string =>
  `outline: 2px solid rgba(59, 130, 246, 0.9); outline-offset: ${paddingPx}px; border-radius: 6px; box-shadow: 0 0 0 ${paddingPx + 4}px rgba(59, 130, 246, 0.25);`;

const defaultWaitForTimeout = (page: Page, durationMs: number): Promise<void> =>
  page.waitForTimeout(durationMs);

/**
 * Applies a presentation-only highlight during the Pass 2 recording. This is a side effect layered
 * on top of the already-emitted `highlight` timeline event — it never emits or matches events, so
 * it cannot break strict replay. The visible hold is implemented with `page.waitForTimeout`.
 */
export async function applyHighlightVisual(input: ApplyHighlightVisualInput): Promise<void> {
  const wait = input.waitForTimeout ?? defaultWaitForTimeout;

  await clearHighlightVisual(input.page);

  if (input.style === "ring") {
    await input.target.highlight({ style: ringStyle(input.paddingPx) });
    await wait(input.page, input.durationMs);
    await input.page.hideHighlight();
    return;
  }

  const box = await input.target.boundingBox();

  if (box === null) {
    // Element has no layout box (e.g. detached or display:none); skip the spotlight gracefully.
    return;
  }

  await input.page.evaluate(
    ({ x, y, width, height, padding }) => {
      window.__demohunterEffects?.showSpotlight(x, y, width, height, padding);
    },
    { ...box, padding: input.paddingPx },
  );
  await wait(input.page, input.durationMs);
  await input.page.evaluate(() => {
    window.__demohunterEffects?.clearSpotlight();
  });
}

/** Clears any active ring or spotlight highlight before the next one is applied. */
export async function clearHighlightVisual(page: Page): Promise<void> {
  await page.hideHighlight();
  await page.evaluate(() => {
    window.__demohunterEffects?.clearSpotlight();
  });
}
