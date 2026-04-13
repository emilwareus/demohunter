# Troubleshooting

These are the main first-run blockers for DemoHunter OSS users.

## Missing Playwright Browser Runtime

Symptoms:

- errors mentioning a missing browser executable
- Playwright telling you to run an install command

Fix:

```bash
bun x playwright install chromium
```

DemoHunter does not bundle browsers. The local Playwright runtime must already exist on the machine that runs generation.

## Missing `ffmpeg` Or `ffprobe`

Symptoms:

- `spawn ffmpeg ENOENT`
- `spawn ffprobe ENOENT`
- `ffmpeg exited with code ...`

Fix:

- install `ffmpeg` using your system package manager
- confirm both commands resolve from the shell:

```bash
ffmpeg -version
ffprobe -version
```

DemoHunter uses `ffmpeg` to produce the final video and poster assets. If those binaries are not on `PATH`, generation cannot finish.

## Missing `OPENAI_API_KEY` For Uncached Narration

Symptoms:

- errors mentioning `OPENAI_API_KEY`
- generation succeeds for cached runs but fails on new narration text

Fix:

```bash
export OPENAI_API_KEY=your_key_here
```

Important:

- cached narration can be reused offline
- uncached narration requires `OPENAI_API_KEY`
- DemoHunter does not provide a custom login flow or credential storage

## Invalid Tour Entrypoint Shape

Symptoms:

- errors saying the tour must default export an object with `id`, `title`, and `run`
- errors saying `setup` or `teardown` must be functions when provided

Fix:

- default export one tour object
- keep `id` and `title` as strings
- keep `run` as a function
- only provide `setup` and `teardown` when they are functions

Start from `demos/sample.tour.ts` or `skills/demohunter/assets/tour.template.ts` if you need a known-good shape.

## App Or `baseURL` Not Reachable

Symptoms:

- `ERR_CONNECTION_REFUSED`
- navigation timeout failures during `page.goto(...)`
- generation failing immediately before any steps run

Fix:

- start your app yourself before running `demohunter generate`
- confirm `baseURL` in `demohunter.config.ts` points at a reachable local or preview URL
- open the URL in a browser before retrying generation

DemoHunter does not wait for your app to boot, manage preview URLs, or repair app readiness automatically.

## Confusion About App Startup, Auth, Or Test Runner Boundaries

DemoHunter is not a replacement for your app bootstrap logic or `@playwright/test`.

Keep these responsibilities in your own code:

- app startup
- login/session flows
- seeding data
- app-specific waits

Keep these responsibilities in DemoHunter:

- tour structure
- narration timing
- screen recording
- portable output generation

## Still Stuck?

Run the repo verification commands to confirm the local install path:

```bash
bun test tests/e2e/examples-contract.test.ts
bun test tests/e2e/init-generate-smoke.test.ts
bun run verify
```
