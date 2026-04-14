# DemoHunter

DemoHunter is an open-source TypeScript CLI and SDK for turning Playwright-style `.tour.ts` files into narrated demo assets on your own machine.

It generates portable output in `.demohunter/<tour-id>/` and uses OpenAI text-to-speech only when narration is not already cached locally.

Released under the [MIT License](LICENSE).

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

Generate from an included example app:

```bash
bun run --cwd examples/vite-demo dev
```

In a second terminal:

```bash
bun run --cwd examples/vite-demo generate
```

To try the starter scaffold today, stay inside this repo checkout and use the local CLI entrypoint or copy the generated files into your own app repo after wiring DemoHunter in as a dependency:

```bash
bun run --cwd packages/cli build
node packages/cli/dist/bin/demohunter.js init
node packages/cli/dist/bin/demohunter.js generate demos/sample.tour.ts
```

## Repo Examples

- `examples/vite-demo`
- `examples/nextjs-demo`

Each example keeps app startup inside the app itself and uses the real CLI from the example root, which is the runnable OSS adoption path in this repo today.

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
