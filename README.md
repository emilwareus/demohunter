# DemoHunter

DemoHunter is an open-source TypeScript CLI and SDK for turning Playwright-style `.tour.ts` files into narrated demo assets on your own machine.

It generates portable output in `.demohunter/<tour-id>/` and uses OpenAI text-to-speech only when narration is not already cached locally.

Released under the [MIT License](LICENSE).

## How to Try DemoHunter

From the repo root, install dependencies, install the global dev CLI, and generate the starter smoke demo:

```bash
bun install
bun x playwright install chromium
bun run install:global

tmpdir=$(mktemp -d /tmp/demohunter-demo.XXXXXX)
cd "$tmpdir"

demohunter init
demohunter generate demos/sample.tour.ts
open .demohunter/sample-smoke/video.mp4
```

That first demo does not need a dev server or `OPENAI_API_KEY`.

If you want to try the real Next.js example after that:

```bash
cd /path/to/demohunter/examples/nextjs-demo
bun run dev
```

In another terminal:

```bash
cd /path/to/demohunter/examples/nextjs-demo
set -a
source ../../.env
set +a
demohunter generate demos/nextjs-demo.tour.ts
open .demohunter/nextjs-demo/video.mp4
```

## What DemoHunter Does

- Runs locally with Bun and Playwright.
- Lets you keep authoring normal Playwright automation in `.tour.ts` files.
- Generates demo assets such as `video.mp4`, `poster.jpg`, `captions.srt`, `captions.vtt`, `chapters.json`, and `manifest.json`.
- Reuses cached narration so repeat runs do not keep calling OpenAI.

## What DemoHunter Does Not Do

- It does not start your app for you.
- It does not manage auth, sessions, or bootstrap flows.
- It does not orchestrate `@playwright/test` suites or wrap your app in a custom runner.
- It does not require any hosted DemoHunter backend.

## Prerequisites

- Bun
- Playwright browser runtime for Chromium
- `ffmpeg` on your system `PATH`
- `OPENAI_API_KEY` only when a run needs uncached narration

Install repo dependencies and the Playwright browser runtime:

```bash
bun install
bun x playwright install chromium
```

## Quickstart

The fastest deterministic first run is the starter smoke demo. It does not need a dev server or `OPENAI_API_KEY`.

From the repo root:

```bash
REPO_ROOT=$(pwd)
bun install
bun x playwright install chromium
bun run --cwd packages/cli build

tmpdir=$(mktemp -d /tmp/demohunter-demo.XXXXXX)
cd "$tmpdir"

bun "$REPO_ROOT/packages/cli/dist/bin/demohunter.js" init
bun "$REPO_ROOT/packages/cli/dist/bin/demohunter.js" generate demos/sample.tour.ts
```

That writes portable output to:

```text
$tmpdir/.demohunter/sample-smoke/
  video.mp4
  poster.jpg
  captions.srt
  captions.vtt
  chapters.json
  manifest.json
```

If you want to inspect the output immediately:

```bash
open .demohunter/sample-smoke/video.mp4
```

## Repo Examples

- `examples/vite-demo`
- `examples/nextjs-demo`

Each example keeps app startup inside the app itself and uses the real CLI from the example root, which is the runnable OSS adoption path in this repo today.

If you want a real app-backed run after the smoke test, start the example app in one terminal and generate in another:

```bash
bun run --cwd examples/vite-demo dev
```

```bash
bun run --cwd examples/vite-demo generate
```

## Agent Skill

Install the markdown skill from [`skills/demohunter`](skills/demohunter/) if you want Codex or Claude to help create or update `.tour.ts` files without inventing non-Playwright abstractions.

## Verification Commands

```bash
bun test tests/e2e/examples-contract.test.ts
bun test tests/skills/demohunter-skill-contract.test.ts
bun run verify
```

GitHub Actions runs the same default `bun run verify` path on pushes to `main` and pull requests after provisioning `ffmpeg` and Playwright Chromium on a fresh runner.

## Docs

- [`docs/getting-started.md`](docs/getting-started.md)
- [`docs/troubleshooting.md`](docs/troubleshooting.md)

## License

DemoHunter is available under the [MIT License](LICENSE).
