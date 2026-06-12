---
status: complete
completed: "2026-06-12"
task_id: 260612-jackson
---

# Summary

Generated a short DemoHunter GitHub demo that scrolls the README, pitches local-first narrated demos, opens an example `.tour.ts` source file, shows the CLI command, and ends with "Always keep your documation videos up-to-date!"

Added the generated demo as a README showcase with an embedded 1.10x video.

Regenerated the committed demo output with ElevenLabs Bella narration (`eleven_multilingual_v2`, `mp3_44100_128`) after rebasing on latest `origin/main`. Updated the intro narration text and removed the long authored padding waits.

Artifacts:

- `.demohunter/demohunter-github/video.mp4` - original DemoHunter output, 27.52 seconds.
- `.demohunter/demohunter-github/video-1.10x.mp4` - requested 1.10x export, 25.08 seconds.

Verification:

- `bun run build`
- `bun packages/cli/dist/bin/demohunter.js generate demos/demohunter-github.tour.ts --flow-only`
- `bun packages/cli/dist/bin/demohunter.js generate demos/demohunter-github.tour.ts`
- `ffprobe` duration checks for original and 1.10x exports
- README link/path check
