export type RecordingEffectsFlags = {
  showCursor: boolean;
  showClickRipple: boolean;
};

export type RecordingEffectsApi = {
  setCursorEnabled: (enabled: boolean) => void;
  setRippleEnabled: (enabled: boolean) => void;
  showRing: (x: number, y: number, width: number, height: number, padding: number) => void;
  clearRing: () => void;
  showSpotlight: (x: number, y: number, width: number, height: number, padding: number) => void;
  clearSpotlight: () => void;
};

declare global {
  interface Window {
    __demohunterEffects?: RecordingEffectsApi;
  }
}

/**
 * Browser-side runtime for the Pass 2 recording effects. This function is serialized and
 * injected via `context.addInitScript`, so it must be fully self-contained: every constant and
 * helper it relies on lives inside the function body, and it references only `window`/`document`
 * globals plus the serializable `flags` argument.
 *
 * It installs `window.__demohunterEffects` exactly once. The visual effects (custom cursor, click
 * ripple, spotlight cutout) are presentation-only and never emit DOM events that would alter the
 * strict two-pass replay timeline.
 */
export function installRecordingEffectsRuntime(flags: RecordingEffectsFlags): void {
  const scope = window as Window & { __demohunterEffects?: RecordingEffectsApi };

  if (scope.__demohunterEffects) {
    return;
  }

  const CURSOR_ID = "demohunter-cursor";
  const RING_ID = "demohunter-highlight-ring";
  const SPOTLIGHT_ID = "demohunter-spotlight";
  const STYLE_ID = "demohunter-effects-style";
  const RIPPLE_CLASS = "demohunter-click-ripple";
  const CURSOR_Z_INDEX = "2147483647";
  const RING_Z_INDEX = "2147483645";
  const SPOTLIGHT_Z_INDEX = "2147483646";

  const state = {
    cursorEnabled: flags.showCursor,
    rippleEnabled: flags.showClickRipple,
  };

  const root = (): HTMLElement => document.body ?? document.documentElement;

  const ensureStyle = (): void => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes demohunter-ripple {
        0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
      .${RIPPLE_CLASS} {
        position: fixed;
        width: 40px;
        height: 40px;
        margin: 0;
        border: 2px solid rgba(59, 130, 246, 0.85);
        border-radius: 50%;
        pointer-events: none;
        z-index: ${CURSOR_Z_INDEX};
        transform: translate(-50%, -50%);
        animation: demohunter-ripple 0.6s ease-out forwards;
      }
    `;
    (document.head ?? document.documentElement).appendChild(style);
  };

  const ensureCursor = (): HTMLElement => {
    let cursor = document.getElementById(CURSOR_ID);

    if (cursor === null) {
      cursor = document.createElement("div");
      cursor.id = CURSOR_ID;
      cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 18px;
        height: 18px;
        margin: 0;
        background: rgba(59, 130, 246, 0.9);
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: ${CURSOR_Z_INDEX};
        transform: translate(-50%, -50%);
        transition: left 0.05s linear, top 0.05s linear;
        display: none;
      `;
      root().appendChild(cursor);
    }

    return cursor;
  };

  const setCursorVisible = (visible: boolean): void => {
    const cursor = document.getElementById(CURSOR_ID);

    if (cursor !== null) {
      cursor.style.display = visible ? "block" : "none";
    }
  };

  document.addEventListener(
    "mousemove",
    (event) => {
      if (!state.cursorEnabled) {
        return;
      }

      const cursor = ensureCursor();
      cursor.style.left = `${(event as MouseEvent).clientX}px`;
      cursor.style.top = `${(event as MouseEvent).clientY}px`;
      cursor.style.display = "block";
    },
    true,
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!state.rippleEnabled) {
        return;
      }

      ensureStyle();
      const ripple = document.createElement("div");
      ripple.className = RIPPLE_CLASS;
      ripple.style.left = `${(event as MouseEvent).clientX}px`;
      ripple.style.top = `${(event as MouseEvent).clientY}px`;
      root().appendChild(ripple);
      window.setTimeout(() => {
        ripple.remove();
      }, 600);
    },
    true,
  );

  const ensureRing = (): HTMLElement => {
    let ring = document.getElementById(RING_ID);

    if (ring === null) {
      ring = document.createElement("div");
      ring.id = RING_ID;
      ring.style.cssText = `
        position: fixed;
        margin: 0;
        border-radius: 8px;
        outline: 2px solid rgba(59, 130, 246, 0.95);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.22), 0 0 22px rgba(59, 130, 246, 0.45);
        pointer-events: none;
        z-index: ${RING_Z_INDEX};
        transition: opacity 150ms ease;
        opacity: 0;
        display: none;
      `;
      root().appendChild(ring);
    }

    return ring;
  };

  const ensureSpotlight = (): HTMLElement => {
    let spotlight = document.getElementById(SPOTLIGHT_ID);

    if (spotlight === null) {
      spotlight = document.createElement("div");
      spotlight.id = SPOTLIGHT_ID;
      spotlight.style.cssText = `
        position: fixed;
        margin: 0;
        border-radius: 8px;
        box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.6);
        outline: 2px solid rgba(59, 130, 246, 0.9);
        pointer-events: none;
        z-index: ${SPOTLIGHT_Z_INDEX};
        transition: opacity 150ms ease;
        opacity: 0;
        display: none;
      `;
      root().appendChild(spotlight);
    }

    return spotlight;
  };

  const api: RecordingEffectsApi = {
    setCursorEnabled(enabled: boolean): void {
      state.cursorEnabled = enabled;

      if (!enabled) {
        setCursorVisible(false);
      }
    },
    setRippleEnabled(enabled: boolean): void {
      state.rippleEnabled = enabled;
    },
    showRing(x: number, y: number, width: number, height: number, padding: number): void {
      const pad = padding > 0 ? padding : 0;
      const ring = ensureRing();
      ring.style.left = `${x - pad}px`;
      ring.style.top = `${y - pad}px`;
      ring.style.width = `${width + pad * 2}px`;
      ring.style.height = `${height + pad * 2}px`;
      ring.style.display = "block";
      ring.style.opacity = "1";
    },
    clearRing(): void {
      const ring = document.getElementById(RING_ID);

      if (ring !== null) {
        ring.style.opacity = "0";
        ring.style.display = "none";
      }
    },
    showSpotlight(x: number, y: number, width: number, height: number, padding: number): void {
      const pad = padding > 0 ? padding : 0;
      const spotlight = ensureSpotlight();
      spotlight.style.left = `${x - pad}px`;
      spotlight.style.top = `${y - pad}px`;
      spotlight.style.width = `${width + pad * 2}px`;
      spotlight.style.height = `${height + pad * 2}px`;
      spotlight.style.display = "block";
      spotlight.style.opacity = "1";
    },
    clearSpotlight(): void {
      const spotlight = document.getElementById(SPOTLIGHT_ID);

      if (spotlight !== null) {
        spotlight.style.opacity = "0";
        spotlight.style.display = "none";
      }
    },
  };

  const setup = (): void => {
    ensureStyle();

    if (state.cursorEnabled) {
      ensureCursor();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }

  scope.__demohunterEffects = api;
}
