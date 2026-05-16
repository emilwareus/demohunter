# DemoHunter

Generate narrated product demos from Playwright scripts. Local. Self-hosted. One npm package.

## Install

```sh
npm install --save-dev demohunter
npx playwright install chromium
```

You also need `ffmpeg` on your `PATH` and an `OPENAI_API_KEY` for narration:

```sh
export OPENAI_API_KEY=sk-...
```

## Quick start

Start your app, then in another terminal:

```sh
npx demohunter init
# edit demohunter.config.ts and set baseURL to your app
npx demohunter generate demos/sample.tour.ts
open .demohunter/sample-smoke/video.mp4
```

That's it. `init` scaffolds a starter tour, config, and demo target. `generate` runs your tour, narrates each `narrate(...)` line with OpenAI TTS, records the screen, and writes a portable `video.mp4` with captions.

## Write your tour

```ts
// demos/product-overview.tour.ts
import { defineTour } from "demohunter";

export default defineTour({
  id: "product-overview",
  title: "Product overview",
  async run({ page, chapter, step, narrate }) {
    await chapter("Welcome");

    await step("Open the landing page", async () => {
      await page.goto("/");
      await page.getByRole("heading", { name: "Welcome" }).waitFor();
      await narrate("This is where your customers land. Three things matter here: the headline, the call to action, and trust signals.");
    });

    await step("Click into pricing", async () => {
      await page.getByRole("link", { name: "Pricing" }).click();
      await page.getByRole("heading", { name: "Plans" }).waitFor();
      await narrate("Three plans, scoped to team size. The yearly toggle saves twenty percent.");
    });
  },
});
```

```sh
npx demohunter generate demos/product-overview.tour.ts
```

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
video.mp4       # narrated demo
poster.jpg      # cover frame
captions.srt    # SRT subtitles
captions.vtt    # WebVTT subtitles
chapters.json   # chapter timeline
manifest.json   # portable, checksummed index
audio/          # per-segment narration clips
```

Identical narration text is cached locally — rerun without re-paying for TTS.

## Agent skill

Teach Claude or Codex to write tours:

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
