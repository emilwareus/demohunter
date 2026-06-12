---
status: complete
completed: "2026-06-12"
task_id: 260612-jackson
---

# Summary

Generated a short DemoHunter GitHub demo that scrolls the README, pitches local-first narrated demos, opens an example `.tour.ts` source file, shows the CLI command, and ends with "Always keep your documation videos up-to-date!"

Added the generated demo as a README showcase with links to the 1.25x video, generated output directory, and tour source.

Artifacts:

- `.demohunter/demohunter-github/video.mp4` - original DemoHunter output, 40.68 seconds.
- `.demohunter/demohunter-github/video-1.25x.mp4` - requested 1.25x export, 32.60 seconds.

Verification:

- `bun run build`
- `bun packages/cli/dist/bin/demohunter.js generate demos/demohunter-github.tour.ts --flow-only`
- `bun packages/cli/dist/bin/demohunter.js generate demos/demohunter-github.tour.ts`
- `ffprobe` duration checks for original and 1.25x exports
- README link/path check
