# Troubleshooting

Common first-run failures and how to fix them.

## `Playwright could not launch the local browser runtime`

The Playwright Chromium runtime is not installed on this machine.

```sh
npx playwright install chromium
```

DemoHunter does not bundle browsers.

## `spawn ffmpeg ENOENT` or `spawn ffprobe ENOENT`

Install `ffmpeg` with your system package manager and confirm both binaries resolve:

```sh
ffmpeg -version
ffprobe -version
```

DemoHunter uses `ffmpeg` to mux audio into video and capture poster frames.

## `OPENAI_API_KEY is not set`

DemoHunter only needs `OPENAI_API_KEY` when generating *uncached* narration.

- If every narration string is already in `.demohunter/cache/`, generation runs offline.
- For new strings, export the key:

```sh
export OPENAI_API_KEY=sk-...
```

DemoHunter does not store credentials.

## `DemoHunter could not reach baseURL`

The CLI tried to load your app and got `ERR_CONNECTION_REFUSED` or a similar network error.

- Start your app yourself before running `demohunter generate`.
- Open the configured `baseURL` in a browser to confirm it is reachable.
- DemoHunter does not wait for your app to boot or manage preview environments.

## `Tour file must default export an object with string id/title and a run function`

The tour file is missing one of the required fields. Minimum shape:

```ts
import { defineTour } from "demohunter";

export default defineTour({
  id: "my-tour",
  title: "My tour",
  async run({ page }) {
    // ...
  },
});
```

Use `npx demohunter init` to scaffold a known-good starter.

## `Refusing to overwrite existing file`

`demohunter init` will not silently overwrite files. Pass `--force` to refresh the starter on top of existing ones:

```sh
npx demohunter init --force
```

## Generated files end up in `git status`

`demohunter generate` writes a `.demohunter/.gitignore` file containing `*` so the directory ignores itself. If you accidentally deleted that file, recreate it or add `.demohunter/` to your project-level `.gitignore`.

## Still stuck?

Run a clean smoke test in a fresh directory:

```sh
mkdir /tmp/dh && cd /tmp/dh
npm init -y
npm install --save-dev demohunter
npx playwright install chromium
npx demohunter init
npx demohunter generate demos/sample.tour.ts
```

If that fails, [open an issue](https://github.com/emilwareus/demohunter/issues) with the command, the full output, and your OS / Node / `ffmpeg` versions.
