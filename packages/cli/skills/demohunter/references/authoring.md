# DemoHunter Tour Authoring

## Authoring Contract

Every tour must default export `defineTour({ ... })` from `demohunter`.

Required fields:

- `id: string`
- `title: string`
- `run(context)`

Optional lifecycle hooks:

- `setup({ page, config, goto })`
- `beforeRecord({ page, config, goto })`
- `teardown({ page, config, goto })`

Lifecycle order:

- `setup` runs before each pass.
- `beforeRecord` runs after `setup` and before the recorded portion of full generation.
- `run` is the first authored hook included in the final screencast.
- `teardown` runs after `run`.

## Run Context

The current SDK exposes these helpers on `run(...)`:

- `page`
- `config`
- `goto(pathOrUrl, options?)`
- `chapter(title, options?)`
- `step(title, fn)`
- `narrate(text, options?)`
- `narrateWhile(text, async ({ sleep }) => { ... }, options?)`
- `waitForStable(options?)`
- `highlight(locator, options?)`
- `snapshot(options?)`
- `assertVisible(locator, options?)`

Useful option details:

- `chapter(..., { id?: string })`
- `narrate(..., { voice?, instructions?, cacheKeyHint? })`
- `narrateWhile(..., { voice?, instructions?, cacheKeyHint? })`
- `sleep(ms)` inside `narrateWhile(...)` waits inside the narration window
- `waitForStable(..., { state?, timeoutMs? })`
- `highlight(..., { name?, paddingPx? })`
- `snapshot(..., { name? })`
- `assertVisible(..., { timeoutMs? })`

## Editing Rules

- Preserve normal Playwright code. Use `page.goto`, locator actions, and `waitFor` calls directly.
- Relative `page.goto("/path")` resolves against `demohunter.config.ts` `baseURL`. Use `goto("/path")` when you want DemoHunter's explicit baseURL resolver.
- Do not invent repo-wide helpers like `login()`, `bootstrapApp()`, `agentContext()`, or cloud-specific wrappers unless they already exist in user code.
- Keep selectors stable and user-facing when possible: headings, labels, buttons, and explicit test ids beat brittle CSS traversal.
- Keep chapters and step titles tied to visible product states.
- Keep narration concise and specific to what the viewer can observe.
- Use `narrate(...)` when the viewer should absorb a static state.
- Use `narrateWhile(...)` when narration should bridge navigation, clicking, typing, waits, generation, highlights, or other visible motion.
- Use `sleep(ms)` inside `narrateWhile(...)` when a UI action should happen at a specific moment in the voiceover.
- Use `beforeRecord` for login, fixture creation, or navigation that should happen before the final video starts.
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
5. Call `narrate(...)` after the UI state is ready and should stay static for a beat.
6. Use `narrateWhile(...)` when narration should continue while the UI moves.
7. Add timed `sleep(ms)` calls inside `narrateWhile(...)` to choreograph clicks, typing, highlights, or waits to narration phrases.
8. Add `snapshot(...)` only when a saved visual checkpoint adds value.

## Narration Timing Pattern

Use `narrateWhile(...)` for transitions and visible motion:

```ts
await narrateWhile("Now we open the workflow builder and switch to the right mode.", async ({ sleep }) => {
  await goto("/chat?new=true");
  await sleep(1200);
  await page.getByTestId("agent-menu-button").click();
  await page.getByTestId("mode-option-builder").click();
});
```

Keep normal DemoHunter helpers inside the wrapped action when they describe visible UI states:

```ts
await narrateWhile("Here is the generated workflow. Notice the schedule and output field.", async ({ sleep }) => {
  await sleep(700);
  await highlight(page.getByText("Daily Digest"));
  await sleep(1200);
  await highlight(page.getByText("readyMessage"));
});
```

## Template

Start from [../assets/tour.template.ts](../assets/tour.template.ts) when creating a new tour file.
