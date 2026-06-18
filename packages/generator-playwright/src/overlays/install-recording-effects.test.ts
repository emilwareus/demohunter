import { describe, expect, mock, test } from "bun:test";

import { installRecordingEffects } from "./install-recording-effects.js";
import { installRecordingEffectsRuntime } from "./recording-effects-runtime.js";

describe("installRecordingEffects", () => {
  test("registers the runtime init script with the requested flags before page creation", async () => {
    const addInitScript = mock(async () => {});
    const context = { addInitScript };

    await installRecordingEffects(context as never, {
      showCursor: true,
      showClickRipple: false,
    });

    expect(addInitScript).toHaveBeenCalledTimes(1);
    expect(addInitScript).toHaveBeenCalledWith(installRecordingEffectsRuntime, {
      showCursor: true,
      showClickRipple: false,
    });
  });
});
