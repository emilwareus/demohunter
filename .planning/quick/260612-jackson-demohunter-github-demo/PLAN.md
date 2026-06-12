---
status: complete
created: "2026-06-12"
task_id: 260612-jackson
---

# Generate DemoHunter GitHub Demo

Create a short DemoHunter tour that showcases the DemoHunter GitHub README, pitches the local-first narrated-demo workflow, navigates into an example `.tour.ts` source file, shows the CLI command, and targets a concise roughly 30-second result with final playback at 1.25x.

## Plan

1. Inspect existing DemoHunter tour authoring patterns and config.
2. Add a root-level demo tour that scrolls through the GitHub README, opens an example tour source file, and shows the generate command.
3. Validate the browser flow locally without requiring TTS.
4. If full generation is possible in the environment, generate the video and apply 1.25x playback speed.

## Result

Created `demos/demohunter-github.tour.ts`, configured the root DemoHunter target for the GitHub repository, generated `.demohunter/demohunter-github/video.mp4`, and exported `.demohunter/demohunter-github/video-1.25x.mp4`.
