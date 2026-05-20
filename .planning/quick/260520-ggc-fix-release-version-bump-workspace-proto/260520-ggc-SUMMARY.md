# Quick Task 260520-ggc Summary

## Completed

- Updated the release workflow version bump to run `npm version` with `--workspaces=false`.
- Added a regression assertion to the OSS onboarding contract test so future release workflow edits keep this guard.

## Verification

- `npm version patch --no-git-tag-version --preid rc --workspaces=false` from `packages/cli` in a clean temp archive exited 0 and produced `0.1.1`.
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/release.yml"); puts "release workflow YAML OK"'`
- `ruby -ryaml -rtmpdir -e 'wf = YAML.load_file(".github/workflows/release.yml"); steps = wf.fetch("jobs").fetch("release").fetch("steps"); Dir.mktmpdir { |dir| steps.each_with_index { |step, i| next unless step["run"]; path = File.join(dir, "step#{i}.sh"); File.write(path, step["run"]); system("bash", "-n", path) or abort("bash syntax failed in step #{i}: #{step["name"]}") } }; puts "release workflow shell blocks OK"'`
- `bun test tests/e2e/oss-onboarding-contract.test.ts`
- `git diff --check`
