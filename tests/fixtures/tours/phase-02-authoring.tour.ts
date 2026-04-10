import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "phase-02-authoring",
  title: "Phase 2 authoring contract",
  async setup({ page }) {
    await page.getByLabel("Email").fill("demo@demohunter.dev");
    await page.getByLabel("Password").fill("demo-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("heading", { name: "Workspace home" }).waitFor();
  },
  async run({ page, chapter, step, narrate, waitForStable, highlight, snapshot, assertVisible }) {
    await chapter("Workspace Settings", { id: "workspace-settings" });

    await step("Open the settings panel", async () => {
      const openSettingsButton = page.getByRole("button", { name: "Open settings" });
      await highlight(openSettingsButton, {
        name: "open-settings-button",
        paddingPx: 12,
      });
      await openSettingsButton.click();
      await waitForStable({ state: "load", timeoutMs: 1_000 });

      const settingsHeading = page.getByRole("heading", { name: "Workspace Settings" });
      await assertVisible(settingsHeading, { timeoutMs: 1_000 });
      await narrate("Workspace settings are available after the bootstrap flow.", {
        cacheKeyHint: "workspace-settings-open",
        instructions: "Keep the tone brief and explanatory.",
        voice: "marin",
      });
      await snapshot({ name: "workspace-settings-open" });
    });

    await step("Save the current settings", async () => {
      await page.getByRole("button", { name: "Save settings" }).click();
      await narrate("Saving keeps the authored flow grounded in ordinary Playwright actions.");
      await assertVisible(page.getByText("Settings saved"), { timeoutMs: 1_000 });
      await snapshot({ name: "workspace-settings-saved" });
    });
  },
  async teardown({ page }) {
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: "Sign in" }).waitFor();
  },
});
