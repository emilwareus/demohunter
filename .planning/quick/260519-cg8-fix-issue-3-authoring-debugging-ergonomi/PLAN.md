# Quick Task 260519-cg8: Issue #3 Authoring/Debugging Ergonomics

## Goal

Implement issue #3 feedback without commits or PRs:

- make relative `page.goto("/path")` resolve against `baseURL`
- write failure debug artifacts
- add progress logging
- add flow-only dry-run validation
- document `add-skill` in installed skill CLI reference
- add `demohunter doctor`

## Plan

1. Extend runtime/config wiring for relative navigation.
2. Add generator reporter/progress events.
3. Add failure debug artifact capture for collection and replay phases.
4. Add dry-run generation mode that validates flow without narration/video.
5. Add CLI option parsing and doctor command.
6. Update docs/skill references.
7. Add focused unit/e2e tests and run verification.

## Constraints

- Do not commit.
- Do not create a PR.
- Keep OSS local-first boundaries intact.
