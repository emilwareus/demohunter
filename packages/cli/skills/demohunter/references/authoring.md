# DemoHunter Tour Authoring

## Authoring Contract

Every tour must default export `defineTour({ ... })` from `demohunter`.

Required fields:

- `id: string`
- `title: string`
- `run(context)`

Optional lifecycle hooks:

- `setup({ page })`
- `teardown({ page })`

## Run Context

The current SDK exposes these helpers on `run(...)`:

- `page`
- `chapter(title, options?)`
- `step(title, fn)`
- `narrate(text, options?)`
- `waitForStable(options?)`
- `highlight(locator, options?)`
- `snapshot(options?)`
- `assertVisible(locator, options?)`

Useful option details:

- `chapter(..., { id?: string })`
- `narrate(..., { voice?, instructions?, cacheKeyHint? })`
- `waitForStable(..., { state?, timeoutMs? })`
- `highlight(..., { name?, paddingPx? })`
- `snapshot(..., { name? })`
- `assertVisible(..., { timeoutMs? })`

## Editing Rules

- Preserve normal Playwright code. Use `page.goto`, locator actions, and `waitFor` calls directly.
- Do not invent repo-wide helpers like `login()`, `bootstrapApp()`, `agentContext()`, or cloud-specific wrappers unless they already exist in user code.
- Keep selectors stable and user-facing when possible: headings, labels, buttons, and explicit test ids beat brittle CSS traversal.
- Keep chapters and step titles tied to visible product states.
- Keep narration concise and specific to what the viewer can observe.
- Only add `setup` or `teardown` when the flow genuinely needs shared preparation or cleanup.

## Config Awareness

Inspect `demohunter.config.ts` before editing:

- `baseURL` tells you which app entrypoint the tour expects.
- `outputDir` and `cacheDir` affect where generated artifacts land.
- `holdPaddingMs`, `record`, and `tts` can explain timing or narration behavior.

Treat config as an input to the tour. Do not duplicate config values inside the tour unless the repo already does that intentionally.

## Authoring Pattern

1. Inspect the target page and existing selectors.
2. Choose one small user-visible flow.
3. Add a chapter for the flow.
4. Wrap each visible state change in `step(...)`.
5. Call `narrate(...)` after the UI state is ready.
6. Add `snapshot(...)` only when a saved visual checkpoint adds value.

## Template

Start from [../assets/tour.template.ts](../assets/tour.template.ts) when creating a new tour file.
