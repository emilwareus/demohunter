import { afterEach, describe, expect, test } from "bun:test";

import { installRecordingEffectsRuntime } from "./recording-effects-runtime.js";

type FakeElement = {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  style: Record<string, string>;
  children: FakeElement[];
  parent: FakeElement | null;
  appendChild: (child: FakeElement) => FakeElement;
  remove: () => void;
};

type Listener = (event: unknown) => void;

function createFakeDom() {
  const byId = new Map<string, FakeElement>();
  const listeners = new Map<string, Listener[]>();
  const timeouts: Array<() => void> = [];
  let created = 0;

  const register = (element: FakeElement): void => {
    if (element.id) {
      byId.set(element.id, element);
    }
  };

  const createElement = (tagName: string): FakeElement => {
    created += 1;
    const element: FakeElement = {
      tagName,
      id: "",
      className: "",
      textContent: "",
      style: {},
      children: [],
      parent: null,
      appendChild(child: FakeElement): FakeElement {
        child.parent = element;
        element.children.push(child);
        register(child);
        return child;
      },
      remove(): void {
        if (element.parent) {
          element.parent.children = element.parent.children.filter((node) => node !== element);
        }
        if (element.id) {
          byId.delete(element.id);
        }
      },
    };
    return element;
  };

  const body = createElement("body");
  const head = createElement("head");
  const documentElement = createElement("html");

  const document = {
    readyState: "complete",
    body,
    head,
    documentElement,
    createElement,
    getElementById: (id: string): FakeElement | null => byId.get(id) ?? null,
    addEventListener: (type: string, listener: Listener): void => {
      const existing = listeners.get(type) ?? [];
      existing.push(listener);
      listeners.set(type, existing);
    },
  };

  const window = {
    setTimeout: (callback: () => void): number => {
      timeouts.push(callback);
      return timeouts.length;
    },
  };

  return {
    document,
    window,
    dispatch: (type: string, event: unknown): void => {
      for (const listener of listeners.get(type) ?? []) {
        listener(event);
      }
    },
    runTimeouts: (): void => {
      while (timeouts.length > 0) {
        timeouts.shift()?.();
      }
    },
    createdCount: (): number => created,
  };
}

function withFakeDom(dom: ReturnType<typeof createFakeDom>): void {
  (globalThis as Record<string, unknown>).document = dom.document;
  (globalThis as Record<string, unknown>).window = dom.window;
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>).document;
  delete (globalThis as Record<string, unknown>).window;
});

describe("installRecordingEffectsRuntime", () => {
  test("registers the effects API and creates the cursor when enabled", () => {
    const dom = createFakeDom();
    withFakeDom(dom);

    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });

    const api = (dom.window as unknown as { __demohunterEffects?: unknown }).__demohunterEffects as
      | Record<string, unknown>
      | undefined;
    expect(typeof api?.setCursorEnabled).toBe("function");
    expect(typeof api?.setRippleEnabled).toBe("function");
    expect(typeof api?.showRing).toBe("function");
    expect(typeof api?.clearRing).toBe("function");
    expect(typeof api?.showSpotlight).toBe("function");
    expect(typeof api?.clearSpotlight).toBe("function");
    expect(dom.document.getElementById("demohunter-cursor")).not.toBeNull();
    expect(dom.document.getElementById("demohunter-effects-style")).not.toBeNull();
  });

  test("is idempotent and does not reinstall on a second call", () => {
    const dom = createFakeDom();
    withFakeDom(dom);

    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });
    const afterFirst = dom.createdCount();
    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });

    expect(dom.createdCount()).toBe(afterFirst);
  });

  test("does not create the cursor when showCursor is false", () => {
    const dom = createFakeDom();
    withFakeDom(dom);

    installRecordingEffectsRuntime({ showCursor: false, showClickRipple: true });

    expect(dom.document.getElementById("demohunter-cursor")).toBeNull();
  });

  test("moves the cursor on mousemove and shows it", () => {
    const dom = createFakeDom();
    withFakeDom(dom);
    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });

    dom.dispatch("mousemove", { clientX: 120, clientY: 64 });

    const cursor = dom.document.getElementById("demohunter-cursor");
    expect(cursor?.style.left).toBe("120px");
    expect(cursor?.style.top).toBe("64px");
    expect(cursor?.style.display).toBe("block");
  });

  test("ignores mousemove updates once the cursor is disabled", () => {
    const dom = createFakeDom();
    withFakeDom(dom);
    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });
    const api = (dom.window as unknown as {
      __demohunterEffects: { setCursorEnabled: (enabled: boolean) => void };
    }).__demohunterEffects;

    api.setCursorEnabled(false);
    dom.dispatch("mousemove", { clientX: 10, clientY: 10 });

    const cursor = dom.document.getElementById("demohunter-cursor");
    expect(cursor?.style.display).toBe("none");
    expect(cursor?.style.left).not.toBe("10px");
  });

  test("spawns a ripple on click and removes it after the timeout", () => {
    const dom = createFakeDom();
    withFakeDom(dom);
    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });

    dom.dispatch("click", { clientX: 50, clientY: 75 });

    const ripple = dom.document.body.children.find(
      (child) => child.className === "demohunter-click-ripple",
    );
    expect(ripple?.style.left).toBe("50px");
    expect(ripple?.style.top).toBe("75px");

    dom.runTimeouts();
    expect(
      dom.document.body.children.some((child) => child.className === "demohunter-click-ripple"),
    ).toBe(false);
  });

  test("does not spawn a ripple when click ripple is disabled", () => {
    const dom = createFakeDom();
    withFakeDom(dom);
    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: false });

    dom.dispatch("click", { clientX: 50, clientY: 75 });

    expect(
      dom.document.body.children.some((child) => child.className === "demohunter-click-ripple"),
    ).toBe(false);
  });

  test("positions the ring highlight from the target box plus padding and clears it", () => {
    const dom = createFakeDom();
    withFakeDom(dom);
    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });
    const api = (dom.window as unknown as {
      __demohunterEffects: {
        showRing: (x: number, y: number, w: number, h: number, p: number) => void;
        clearRing: () => void;
      };
    }).__demohunterEffects;

    api.showRing(30, 40, 200, 60, 10);
    const ring = dom.document.getElementById("demohunter-highlight-ring");
    expect(ring?.style.left).toBe("20px");
    expect(ring?.style.top).toBe("30px");
    expect(ring?.style.width).toBe("220px");
    expect(ring?.style.height).toBe("80px");
    expect(ring?.style.display).toBe("block");
    expect(ring?.style.opacity).toBe("1");

    api.clearRing();
    expect(ring?.style.opacity).toBe("0");
    expect(ring?.style.display).toBe("none");
  });

  test("positions the spotlight cutout from the target box plus padding and clears it", () => {
    const dom = createFakeDom();
    withFakeDom(dom);
    installRecordingEffectsRuntime({ showCursor: true, showClickRipple: true });
    const api = (dom.window as unknown as {
      __demohunterEffects: {
        showSpotlight: (x: number, y: number, w: number, h: number, p: number) => void;
        clearSpotlight: () => void;
      };
    }).__demohunterEffects;

    api.showSpotlight(10, 20, 100, 40, 8);
    const spotlight = dom.document.getElementById("demohunter-spotlight");
    expect(spotlight?.style.left).toBe("2px");
    expect(spotlight?.style.top).toBe("12px");
    expect(spotlight?.style.width).toBe("116px");
    expect(spotlight?.style.height).toBe("56px");
    expect(spotlight?.style.display).toBe("block");
    expect(spotlight?.style.opacity).toBe("1");

    api.clearSpotlight();
    expect(spotlight?.style.opacity).toBe("0");
    expect(spotlight?.style.display).toBe("none");
  });
});
