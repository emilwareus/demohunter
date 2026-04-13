import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "vite-demo",
  title: "Vite OSS example",
  async run({ page, chapter, step, narrate, snapshot }) {
    await chapter("Deployment Checklist", { id: "deployment-checklist" });

    await step("Open the deployment checklist", async () => {
      await page.goto(new URL("#deployment-checklist", page.url()).href);
      await page.getByRole("heading", { name: "Deployment checklist" }).waitFor();
      await narrate("The Vite example proves the same workflow against a lightweight client rendered app.");
      await snapshot({ name: "deployment-checklist" });
    });

    await chapter("Playback Notes", { id: "playback-notes" });

    await step("Show the playback notes", async () => {
      await page.goto(new URL("#playback-notes", page.url()).href);
      await page.getByRole("heading", { name: "Playback notes" }).waitFor();
      await narrate("It stays local only, with selectors chosen for demo generation instead of framework showcase depth.");
      await snapshot({ name: "playback-notes" });
    });
  },
});
