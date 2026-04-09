export type DemoHunterNarrate = (text: string, options?: Record<string, unknown>) => Promise<void>;

export type DemoHunterRunContext = {
  page: unknown;
  chapter: unknown;
  step: unknown;
  narrate: DemoHunterNarrate;
};

export type DemoHunterTour = {
  id: string;
  title: string;
  run: (context: DemoHunterRunContext) => Promise<void>;
};

export function defineTour<T extends DemoHunterTour>(tour: T): T {
  return tour;
}
