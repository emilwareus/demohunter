import type { Page } from "playwright";

export type ScreencastViewport = {
  height: number;
  width: number;
};

export type StartScreencastInput = {
  outputPath: string;
  page: Page;
  showActions: boolean;
  /**
   * Cursor decoration for Playwright's action annotations. Set to "none" when a custom DOM cursor
   * is injected to avoid a double cursor; defaults to Playwright's animated pointer otherwise.
   */
  actionCursor?: "pointer" | "none";
  viewport: ScreencastViewport;
};

export type StopScreencastInput = {
  page: Page;
  primaryError?: unknown;
};

const ACTION_ANNOTATION_SETTINGS = {
  duration: 500,
  position: "top-right",
} as const;

export async function startScreencast({
  outputPath,
  page,
  showActions,
  actionCursor,
  viewport,
}: StartScreencastInput): Promise<void> {
  await page.screencast.start({
    path: outputPath,
    size: viewport,
  });

  if (!showActions) {
    return;
  }

  await page.screencast.showActions(
    actionCursor === undefined
      ? ACTION_ANNOTATION_SETTINGS
      : { ...ACTION_ANNOTATION_SETTINGS, cursor: actionCursor },
  );
}

export async function stopScreencast({ page, primaryError }: StopScreencastInput): Promise<void> {
  let stopError: unknown;

  try {
    await page.screencast.stop();
  } catch (error) {
    stopError = error;
  }

  if (primaryError !== undefined) {
    throw primaryError;
  }

  if (stopError !== undefined) {
    throw stopError;
  }
}
