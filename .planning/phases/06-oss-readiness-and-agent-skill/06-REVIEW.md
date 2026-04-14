---
phase: 06-oss-readiness-and-agent-skill
reviewed: 2026-04-14T04:53:34Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - .github/workflows/ci.yml
  - LICENSE
  - README.md
  - docs/getting-started.md
  - docs/troubleshooting.md
  - examples/nextjs-demo/app/page.tsx
  - examples/nextjs-demo/demohunter.config.ts
  - examples/nextjs-demo/demos/nextjs-demo.tour.ts
  - examples/nextjs-demo/next-env.d.ts
  - examples/nextjs-demo/next.config.ts
  - examples/nextjs-demo/package.json
  - examples/nextjs-demo/tsconfig.json
  - examples/vite-demo/demohunter.config.ts
  - examples/vite-demo/demos/vite-demo.tour.ts
  - examples/vite-demo/index.html
  - examples/vite-demo/package.json
  - examples/vite-demo/src/App.tsx
  - examples/vite-demo/src/main.ts
  - packages/cli/src/bin/demohunter.test.ts
  - packages/cli/src/bin/demohunter.ts
  - packages/cli/src/commands/generate.test.ts
  - packages/cli/src/commands/generate.ts
  - packages/cli/src/commands/init.ts
  - packages/generator-playwright/src/generate.ts
  - packages/generator-playwright/src/output/prepare-output-dir.test.ts
  - packages/generator-playwright/src/output/prepare-output-dir.ts
  - skills/demohunter/SKILL.md
  - skills/demohunter/assets/tour.template.ts
  - skills/demohunter/references/authoring.md
  - skills/demohunter/references/cli.md
  - skills/demohunter/references/troubleshooting.md
  - tests/e2e/examples-contract.test.ts
  - tests/e2e/oss-onboarding-contract.test.ts
  - tests/skills/demohunter-skill-contract.test.ts
findings:
  critical: 0
  warning: 3
  info: 0
  total: 3
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-14T04:53:34Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Phase 6 materially improves OSS readiness: the example apps generate successfully, the new skill bundle is internally consistent, and the advertised default verification path currently passes. I ran `bun test tests/e2e/examples-contract.test.ts`, `bun test tests/e2e/oss-onboarding-contract.test.ts tests/skills/demohunter-skill-contract.test.ts packages/cli/src/commands/generate.test.ts packages/cli/src/bin/demohunter.test.ts packages/generator-playwright/src/output/prepare-output-dir.test.ts`, both example framework builds, and `bun run verify`; all passed in the current workspace.

The remaining issues are public-contract problems introduced by this phase: the README/getting-started “fresh project” path is not runnable outside the monorepo, the new generate error translation now mislabels generic `page.goto(...)` failures as baseURL reachability problems, and the default CI contract does not keep the example apps’ framework-native build path under coverage.

## Warnings

### WR-01: Fresh-project onboarding command does not work outside the workspace

**File:** `README.md:51-56`
**Issue:** The new onboarding docs tell users to run `bun x demohunter init` and `bun x demohunter generate ...` in a fresh project, and the contract test only asserts that those strings exist (`docs/getting-started.md:57-75`, `tests/e2e/oss-onboarding-contract.test.ts:16-33`). In practice, running `bun x demohunter init` from a temp directory currently fails with an npm 404 because `demohunter` is not installable from outside this workspace. That makes the newly documented “start in a new project” path a real docs/code mismatch for OSS users.
**Fix:**
```text
Either:
1. Change the docs to advertise only the repo-local flows that actually work today, or
2. Publish/install the CLI under the documented package name and add an executable contract test that runs the public bootstrap command from a temp directory.
```

### WR-02: `generate` now rewrites unrelated `page.goto(...)` failures as baseURL reachability errors

**File:** `packages/cli/src/commands/generate.ts:133-153`
**Issue:** `isBaseUrlReachabilityError()` treats any error message containing `page.goto:` as an app-readiness failure. That is too broad: navigation timeouts and other Playwright `page.goto(...)` failures that are not caused by an unreachable server now get rewritten to `DemoHunter could not reach baseURL ...`, which hides the real failure mode and misdirects debugging. The new test coverage only exercises `ERR_CONNECTION_REFUSED` (`packages/cli/src/commands/generate.test.ts:149-170`), so this regression is not guarded.
**Fix:**
```ts
function isBaseUrlReachabilityError(message: string): boolean {
  return (
    message.includes("ERR_CONNECTION_REFUSED") ||
    message.includes("ERR_CONNECTION_TIMED_OUT") ||
    message.includes("ERR_CONNECTION_RESET") ||
    message.includes("ERR_NAME_NOT_RESOLVED") ||
    message.includes("ERR_NETWORK_CHANGED")
  );
}
```

Add a regression test for a generic `page.goto: Timeout ...` message and either preserve the original error text or fall back to the original error instead of relabeling it as a baseURL outage.

### WR-03: Phase 6’s default CI contract does not keep the example build path under test

**File:** `.github/workflows/ci.yml:42-46`
**Issue:** The new public CI workflow only provisions Chromium and runs the repo verify path. The only example contract added in this phase exercises `bun run dev` plus `bun run generate` (`tests/e2e/examples-contract.test.ts:59-98`); it never runs `examples/nextjs-demo build` or `examples/vite-demo build`. That leaves the framework-native build path from Plan 06-01 outside the default CI contract, so example build regressions can ship even though the repo advertises the examples as real consumer apps.
**Fix:**
```yaml
- name: Build Next.js example
  run: bun run --cwd examples/nextjs-demo build

- name: Build Vite example
  run: bun run --cwd examples/vite-demo build
```

If the intent is to keep `bun run verify` as the single public contract, move those two commands into the verify path or add an equivalent automated test that shells the example build scripts directly.

---

_Reviewed: 2026-04-14T04:53:34Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
