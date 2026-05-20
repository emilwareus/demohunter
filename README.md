# DemoHunter

**Narrated product demos as code**

DemoHunter turns Playwright-style automation into narrated product demos. You write a `.tour.ts` file, run the CLI locally, and get portable demo assets under `.demohunter/`: video, captions, chapters, poster, narration audio, and a checksummed manifest.

Two workflows are especially useful:

- **Product, docs, and DevRel**: keep marketing pages, release notes, and onboarding videos in sync with the product by generating demos from repeatable scripts.
- **AI coding agents**: let an agent attach a narrated demo of its work to a pull request so reviewers can see the changed flow in motion.

DemoHunter is local-first. It does not require a hosted backend, and OpenAI is used only for text-to-speech when uncached narration needs to be generated.

## Features

- [x] Cached narration. Same text never hits the TTS API twice.
- [x] MP4 by default, WebM optional.
- [x] SRT and VTT captions generated from narration.
- [x] Chapter markers and overlays.
- [x] Action overlays (mouse clicks visible on the recording).
- [x] All three Playwright browsers: Chromium, Firefox, WebKit.
- [x] Per-call voice and tone overrides on `narrate()`.
- [x] OpenAI TTS (`gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`).
- [x] Portable `manifest.json` with sha256 checksums.
- [x] Offline regeneration when narration is fully cached.
- [x] Agent skill for Claude and Codex.
- [ ] Other AI voice providers (ElevenLabs, Cartesia, local Piper).
- [ ] Background music and sound effects.
- [ ] Hosted / cloud generation.
- [ ] Cursor agent skill.
- [ ] GitHub PR comment / webhook automation / GitHub Action.

PRs welcome on anything unchecked.

## Install

```sh
npm install --save-dev demohunter
npx playwright install chromium
export OPENAI_API_KEY=sk-...
```

You also need `ffmpeg` and `ffprobe` on your `PATH`. `OPENAI_API_KEY` is only required when generating narration that is not already cached.

## Quick start

Start your app on `http://localhost:3000`. In another terminal:

```sh
npx demohunter init
# edit demohunter.config.ts and point baseURL at your app
npx demohunter generate demos/sample.tour.ts
open .demohunter/sample-smoke/video.mp4
```

That's the full loop: scaffold, write the tour, render the video.

## What a tour looks like

```ts
// demos/billing-overview.tour.ts
import { defineTour } from "demohunter";

export default defineTour({
  id: "billing-overview",
  title: "Billing overview",
  async beforeRecord({ goto, page }) {
    await goto("/");
    await page.getByRole("heading", { name: "Workspace" }).waitFor();
  },
  async run({ page, chapter, step, narrate, narrateWhile }) {
    await chapter("Open the workspace");

    await step("Land on the dashboard", async () => {
      await narrate("This is the billing workspace. Invoices, exports, and credits all live in one place.");
    });

    await step("Create a new invoice", async () => {
      await narrateWhile("Creating an invoice is one step now. The customer field has type-ahead search built in.", async ({ sleep }) => {
        await page.getByRole("button", { name: "New invoice" }).click();
        await sleep(700);
        await page.getByLabel("Customer").fill("Acme");
      });
    });
  },
});
```

```sh
npx demohunter generate demos/billing-overview.tour.ts
```

You get `.demohunter/billing-overview/video.mp4` with narration timed to each step or choreographed over visible motion, plus captions and a manifest.

## Config

```ts
// demohunter.config.ts
import { defineConfig } from "demohunter";

export default defineConfig({
  baseURL: "http://localhost:3000",
  // tts: { voice: "marin", model: "gpt-4o-mini-tts" },
  // viewport: { width: 1440, height: 900 },
});
```

## Output

Every run writes to `.demohunter/<tour-id>/`:

```
video.mp4       narrated demo
poster.jpg      cover frame
captions.srt    SRT subtitles
captions.vtt    WebVTT subtitles
chapters.json   chapter timeline
manifest.json   portable, checksummed index
audio/          per-segment narration clips
```

Identical narration text is cached locally. Reruns don't re-pay for TTS.

## Agent skill

Teach Claude or Codex to write tours for you:

```sh
npx demohunter add-skill                  # installs to both .claude/ and .codex/
npx demohunter add-skill --target claude  # or just one
```

## Docs

- [Getting started](https://github.com/emilwareus/demohunter/blob/main/docs/getting-started.md)
- [Troubleshooting](https://github.com/emilwareus/demohunter/blob/main/docs/troubleshooting.md)

## CLI

```sh
npx demohunter init                       # scaffold starter tour + config
npx demohunter generate <tour-file>       # run a tour, write output
npx demohunter generate <tour-file> --dry-run
                                           # validate browser flow without TTS/video
npx demohunter doctor                     # check local prerequisites
npx demohunter cache list|prune|clear     # manage narration cache
npx demohunter add-skill [--target ...]   # install agent skill (claude | codex | both)
npx demohunter --help
```

## License

[MIT](LICENSE)
