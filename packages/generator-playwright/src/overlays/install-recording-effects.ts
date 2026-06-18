import type { BrowserContext } from "playwright";

import {
  installRecordingEffectsRuntime,
  type RecordingEffectsFlags,
} from "./recording-effects-runtime.js";

/**
 * Installs the Pass 2 recording-effects runtime on a browser context via `addInitScript` so that
 * the custom cursor, click ripple, and spotlight helpers are available on every page (including
 * after navigations) before the recorded replay begins. Call this before creating the page.
 */
export async function installRecordingEffects(
  context: BrowserContext,
  flags: RecordingEffectsFlags,
): Promise<void> {
  await context.addInitScript(installRecordingEffectsRuntime, flags);
}
