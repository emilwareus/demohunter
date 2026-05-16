# DemoHunter

**Narrated product demos as code**

Demo Hunter is an extension to playwright that helps you record demos of you product with AI-voice narration. IMO, there are two good use cases for this: 

- **Product, docs, and DevRel**: keep marketing pages, release notes, and onboarding videos in sync with the product. Record and crate demos in your CI, up-to-date with your product. 
- **AI coding agents**: let your agent attach a narrated demo of its own work to every pull request. Reviewers see exactly what changed, in motion, with AI explaining what they're looking at.

Hope you enjoy it! PRs and issues welcome :) No real strong opinion on things here, just needed this myself.

## Install

```sh
npm install --save-dev demohunter
npx playwright install chromium
export OPENAI_API_KEY=sk-...
```

You also need `ffmpeg` on your `PATH`.

## Quick start

Start your app on `http://localhost:3000`. In another terminal:

```sh
npx demohunter init
# edit demohunter.config.ts and point baseURL at your app
npx demohunter generate demos/sample.tour.ts
open .demohunter/sample-smoke/video.mp4
```

That's the full loop: scaffold → write the tour → render the video.

## What a tour looks like

```ts
// demos/billing-overview.tour.ts
import { defineTour } from "demohunter";

export default defineTour({
  id: "billing-overview",
  title: "Billing overview",
  async run({ page, chapter, step, narrate }) {
    await chapter("Open the workspace");

    await step("Land on the dashboard", async () => {
      await page.goto("/");
      await page.getByRole("heading", { name: "Workspace" }).waitFor();
      await narrate("This is the billing workspace. Invoices, exports, and credits all live in one place.");
    });

    await step("Create a new invoice", async () => {
      await page.getByRole("button", { name: "New invoice" }).click();
      await page.getByLabel("Customer").fill("Acme");
      await narrate("Creating an invoice is one step now. The customer field has type-ahead search built in.");
    });
  },
});
```

```sh
npx demohunter generate demos/billing-overview.tour.ts
```

You get `.demohunter/billing-overview/video.mp4` with the narration timed to each step, plus captions and a manifest.

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

## CLI

```sh
npx demohunter init                       # scaffold starter tour + config
npx demohunter generate <tour-file>       # run a tour, write output
npx demohunter cache list|prune|clear     # manage narration cache
npx demohunter add-skill [--target ...]   # install agent skill (claude | codex | both)
npx demohunter --help
```

## License

[MIT](LICENSE)
