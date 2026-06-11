import type { DemoHunterAuthorRunContext, DemoHunterLifecycleContext } from "./runtime-types.js";

export type {
  DemoHunterAuthorNarrateWhile,
  DemoHunterAuthorRunContext,
  DemoHunterLifecycleContext,
  DemoHunterNarrate,
  DemoHunterNarrateWhile,
  DemoHunterNarrationTimeline,
  DemoHunterNarrateWhileTimeline,
  DemoHunterRunContext,
} from "./runtime-types.js";

export type DemoHunterTour = {
  id: string;
  title: string;
  setup?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
  beforeRecord?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
  run: (context: DemoHunterAuthorRunContext) => Promise<void> | void;
  teardown?: (context: DemoHunterLifecycleContext) => Promise<void> | void;
};

export function defineTour<T extends DemoHunterTour>(tour: T): T {
  return tour;
}
