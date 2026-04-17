# Getting Started

This guide covers the real OSS path for DemoHunter: you run your own app, point DemoHunter at it through `demohunter.config.ts`, and generate portable demo output locally.

## Product Boundary

DemoHunter stays intentionally narrow:

- Keep normal Playwright logic in your own `setup` and `run` code.
- Start your app yourself before generation.
- Handle auth, seeded data, and session state in your own Playwright steps.
- Use DemoHunter to collect narration timing, record the flow, and write `.demohunter/<tour-id>/`.

If you want a tool that boots your app or manages Playwright test orchestration, that is outside the current OSS scope.

## Prerequisites

1. Install Bun.
2. Install repo dependencies with `bun install`.
3. Install the Playwright Chromium runtime with `bun x playwright install chromium`.
4. Install `ffmpeg` and ensure `ffmpeg` and `ffprobe` are on your `PATH`.
5. Export `OPENAI_API_KEY` only if your tour needs narration that is not already cached.

## Verified First Run

The cleanest first run is the starter smoke demo in a fresh temp directory. It does not need a running app or `OPENAI_API_KEY`.

From the repo root:

```bash
REPO_ROOT=$(pwd)
bun run --cwd packages/cli build

tmpdir=$(mktemp -d /tmp/demohunter-demo.XXXXXX)
cd "$tmpdir"

bun "$REPO_ROOT/packages/cli/dist/bin/demohunter.js" init
bun "$REPO_ROOT/packages/cli/dist/bin/demohunter.js" generate demos/sample.tour.ts
```

That creates:

- `demohunter.config.ts`
- `demos/sample.tour.ts`
- `demos/sample-site/index.html`
- `.demohunter/sample-smoke/video.mp4`
- `.demohunter/sample-smoke/poster.jpg`
- `.demohunter/sample-smoke/captions.srt`
- `.demohunter/sample-smoke/captions.vtt`
- `.demohunter/sample-smoke/chapters.json`
- `.demohunter/sample-smoke/manifest.json`

If you want to inspect the result immediately:

```bash
open .demohunter/sample-smoke/video.mp4
```

## First Run With The Included Examples

Vite example:

```bash
bun run --cwd examples/vite-demo dev
```

Then, in another terminal:

```bash
bun run --cwd examples/vite-demo generate
```

Next.js example:

```bash
bun run --cwd examples/nextjs-demo dev
```

Then:

```bash
bun run --cwd examples/nextjs-demo generate
```

Both example projects keep DemoHunter usage close to a real consumer app:

- `demohunter.config.ts` lives in the example root
- the example app owns its own dev server
- the tour file lives under `demos/*.tour.ts`
- generated assets land under that example's `.demohunter/`

## Start From The Included Starter

If you want the starter files inside your current directory instead of a temp folder, run the same built CLI locally:

```bash
bun run --cwd packages/cli build
bun packages/cli/dist/bin/demohunter.js init
```

That creates:

- `demohunter.config.ts`
- `demos/sample.tour.ts`
- `demos/sample-site/index.html`

If the sample tour does not use narration, generation works without `OPENAI_API_KEY`:

```bash
bun packages/cli/dist/bin/demohunter.js generate demos/sample.tour.ts
```

If you want to move that starter into your own app repo, copy the generated `demohunter.config.ts`, `demos/`, and sample site files after you have decided how you want to consume DemoHunter there.

## Tour Authoring Shape

DemoHunter expects a default export with:

- string `id`
- string `title`
- `run(runtime)` function
- optional `setup(runtime)` and `teardown(runtime)` functions

Keep selectors and flows Playwright-native. If you want agent help authoring tours, use the installable skill in `skills/demohunter/`.

## Output

A successful run writes a portable directory similar to:

```text
.demohunter/<tour-id>/
  video.mp4
  poster.jpg
  captions.srt
  captions.vtt
  chapters.json
  manifest.json
  audio/
```

## Recommended Verification

From the repo root:

```bash
bun test tests/e2e/examples-contract.test.ts
bun test tests/e2e/init-generate-smoke.test.ts
bun run verify
```

If you hit environment or first-run failures, continue with [`docs/troubleshooting.md`](./troubleshooting.md).
