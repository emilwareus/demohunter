import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ConsoleMessage, Page, Request } from "playwright";

import type { TourRuntimeEvent } from "../execute/generator-types.js";

const MAX_BODY_TEXT_LENGTH = 8_000;
const MAX_BUFFERED_EVENTS = 50;

export type DebugPhase = "collect-timeline" | "record-replay" | "dry-run";

export type DebugArtifactResult = {
  directory: string;
  failureJsonPath: string;
  bodyTextPath?: string;
  screenshotPath?: string;
};

export type DebugCapture = {
  captureFailure: (input: {
    error: unknown;
    lastRuntimeEvent?: TourRuntimeEvent;
    phase: DebugPhase;
  }) => Promise<DebugArtifactResult>;
  dispose: () => void;
};

type BufferedConsoleEvent = {
  type: string;
  text: string;
};

type BufferedFailedRequest = {
  failureText?: string;
  method: string;
  resourceType: string;
  url: string;
};

export function attachDebugCapture(input: {
  outputDir: string;
  page: Page;
  timestamp?: () => Date;
}): DebugCapture {
  const consoleEvents: BufferedConsoleEvent[] = [];
  const failedRequests: BufferedFailedRequest[] = [];
  const pageErrors: string[] = [];
  const timestamp = input.timestamp ?? (() => new Date());

  const onConsole = (message: ConsoleMessage) => {
    append(consoleEvents, {
      text: readConsoleText(message),
      type: readConsoleType(message),
    });
  };
  const onPageError = (error: Error) => {
    append(pageErrors, error.stack || error.message);
  };
  const onRequestFailed = (request: Request) => {
    append(failedRequests, {
      failureText: request.failure()?.errorText,
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
    });
  };

  input.page.on("console", onConsole);
  input.page.on("pageerror", onPageError);
  input.page.on("requestfailed", onRequestFailed);

  return {
    async captureFailure({ error, lastRuntimeEvent, phase }) {
      const directory = path.join(
        input.outputDir,
        "debug",
        `${toFilesystemTimestamp(timestamp())}-${phase}`,
      );
      await mkdir(directory, { recursive: true });

      const failureJsonPath = path.join(directory, "failure.json");
      let screenshotPath: string | undefined;
      let bodyTextPath: string | undefined;
      let url: string | undefined;
      let title: string | undefined;
      const captureErrors: string[] = [];

      try {
        url = input.page.url();
      } catch (captureError) {
        captureErrors.push(`url: ${describeError(captureError)}`);
      }

      try {
        title = await input.page.title();
      } catch (captureError) {
        captureErrors.push(`title: ${describeError(captureError)}`);
      }

      try {
        const bodyText = await input.page.locator("body").innerText({ timeout: 1_000 });
        bodyTextPath = path.join(directory, "body.txt");
        await writeFile(bodyTextPath, truncate(bodyText, MAX_BODY_TEXT_LENGTH), "utf8");
      } catch (captureError) {
        captureErrors.push(`body: ${describeError(captureError)}`);
      }

      try {
        screenshotPath = path.join(directory, "screenshot.png");
        await input.page.screenshot({ fullPage: true, path: screenshotPath });
      } catch (captureError) {
        screenshotPath = undefined;
        captureErrors.push(`screenshot: ${describeError(captureError)}`);
      }

      await writeFile(
        failureJsonPath,
        `${JSON.stringify(
          {
            phase,
            error: serializeError(error),
            page: {
              title,
              url,
            },
            lastRuntimeEvent,
            console: consoleEvents,
            pageErrors,
            failedRequests,
            artifacts: {
              bodyTextPath: bodyTextPath === undefined ? undefined : path.basename(bodyTextPath),
              screenshotPath: screenshotPath === undefined ? undefined : path.basename(screenshotPath),
            },
            captureErrors,
          },
          null,
          2,
        )}\n`,
        "utf8",
      );

      return {
        bodyTextPath,
        directory,
        failureJsonPath,
        screenshotPath,
      };
    },
    dispose() {
      input.page.off("console", onConsole);
      input.page.off("pageerror", onPageError);
      input.page.off("requestfailed", onRequestFailed);
    },
  };
}

function append<T>(items: T[], item: T): void {
  items.push(item);

  if (items.length > MAX_BUFFERED_EVENTS) {
    items.shift();
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readConsoleText(message: unknown): string {
  if (
    typeof message === "object" &&
    message !== null &&
    "text" in message &&
    typeof message.text === "function"
  ) {
    return String(message.text());
  }

  return String(message);
}

function readConsoleType(message: unknown): string {
  if (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    typeof message.type === "function"
  ) {
    return String(message.type());
  }

  return "unknown";
}

function serializeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function toFilesystemTimestamp(date: Date): string {
  return date.toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n[truncated]`;
}
