import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "vite-demo",
  title: "Vite OSS example",
  async run({ page, chapter, step, narrate, waitForStable, assertVisible, snapshot }) {
    await chapter("Deployment Checklist", { id: "deployment-checklist" });

    await step("Open the deployment checklist", async () => {
      await page.getByRole("button", { name: "Open deployment checklist" }).click();
      await waitForStable({ state: "load", timeoutMs: 1_000 });
      await assertVisible(page.getByRole("heading", { name: "Deployment checklist" }), {
        timeoutMs: 1_000,
      });
      await narrate("The Vite example proves the same workflow against a lightweight client rendered app.");
      await snapshot({ name: "deployment-checklist" });
    });

    await chapter("Playback Notes", { id: "playback-notes" });

    await step("Show the playback notes", async () => {
      await page.getByRole("button", { name: "Show playback notes" }).click();
      await waitForStable({ state: "load", timeoutMs: 1_000 });
      await assertVisible(page.getByRole("heading", { name: "Playback notes" }), {
        timeoutMs: 1_000,
      });
      await narrate("It stays local only, with selectors chosen for demo generation instead of framework showcase depth.");
      await snapshot({ name: "playback-notes" });
    });
  },
});
