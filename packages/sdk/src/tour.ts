import type { DemoHunterLifecycleContext, DemoHunterRunContext } from "./runtime-types.js";

export type {
  DemoHunterLifecycleContext,
  DemoHunterNarrate,
  DemoHunterNarrateWhile,
  DemoHunterNarrationTimeline,
  DemoHunterRunContext,
} from "./runtime-types.js";

export type DemoHunterTour = {
  id: string;
  title: string;
  setup?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
  beforeRecord?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
  run: (context: DemoHunterRunContext) => Promise<void> | void;
  teardown?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
};

export function defineTour<T extends DemoHunterTour>(tour: T): T {
  return tour;
}
