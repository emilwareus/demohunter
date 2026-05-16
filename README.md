# DemoHunter

[![CI](https://github.com/emilwareus/demohunter/actions/workflows/ci.yml/badge.svg)](https://github.com/emilwareus/demohunter/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/demohunter.svg)](https://www.npmjs.com/package/demohunter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Generate narrated demo videos from Playwright tours. Runs locally. Outputs a portable `video.mp4`, captions, and a JSON manifest.

```ts
import { defineTour } from "demohunter";

export default defineTour({
  id: "product-overview",
  title: "Product overview",
  async run({ page, chapter, step, narrate }) {
    await chapter("Welcome");
    await step("Show the landing page", async () => {
      await page.goto("/");
      await narrate("This is the home page of the app.");
    });
  },
});
```

## Install

```sh
npm install --save-dev demohunter
npx playwright install chromium
```

`ffmpeg` must be on your `PATH`. `OPENAI_API_KEY` is only needed when narration is not already cached.

## Usage

```sh
npx demohunter init                              # scaffold sample tour + config + .gitignore
npx demohunter generate demos/sample.tour.ts     # run the tour, write .demohunter/<id>/
npx demohunter cache list|prune|clear            # manage narration cache
npx demohunter add-skill --target claude         # install agent skill (also: codex, both)
```

## Output

A successful run writes to `.demohunter/<tour-id>/`:

```
video.mp4         # narrated demo
poster.jpg        # cover frame
captions.srt      # subtitle track
captions.vtt      # web subtitle track
chapters.json     # chapter timeline
manifest.json     # portable index, sha256 checksummed
audio/            # exported narration clips
```

## How it works

DemoHunter is a thin layer on top of Playwright. You write your tour like normal browser automation, plus calls to `narrate(...)`, `chapter(...)`, and `step(...)`. Generation runs in two passes:

1. Resolve every narration through OpenAI TTS, cache the audio locally, measure real durations.
2. Replay the tour while recording the screen, hold each narrated step for its real audio length, then mux video + audio + captions.

Identical narration text reuses cached audio — no second API call. Cache lives under `.demohunter/cache/`.

## Config

`demohunter.config.ts` controls the runtime:

```ts
import { defineConfig } from "demohunter";

export default defineConfig({
  baseURL: "http://localhost:3000",
  // outputDir: ".demohunter",
  // cacheDir: ".demohunter/cache",
  // browser: "chromium",
  // viewport: { width: 1440, height: 900 },
  // record: { format: "mp4", showActions: true, showChapters: true },
  // tts: { model: "gpt-4o-mini-tts", voice: "marin", format: "mp3" },
});
```

## What DemoHunter does *not* do

- Start your app for you. Run your dev server in another terminal.
- Manage auth or session state. Do that in your tour's `setup({ page })` with normal Playwright.
- Replace `@playwright/test`. DemoHunter is a generator, not a test runner.

## Docs

- [Getting started](docs/getting-started.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Examples](examples/) — runnable Next.js and Vite consumer apps
- [Agent skill](packages/cli/skills/demohunter/) — installable docs for Claude and Codex

## License

[MIT](LICENSE)
