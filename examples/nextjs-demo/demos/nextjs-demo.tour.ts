import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "nextjs-demo",
  title: "Next.js OSS example",
  async run({ page, chapter, step, narrate, snapshot }) {
    await chapter("Release Brief", { id: "release-brief" });

    await step("Open the launch checklist", async () => {
      await page.goto(new URL("#launch-checklist", page.url()).href);
      await page.getByRole("heading", { name: "Launch checklist" }).waitFor();
      await narrate("The Next.js example keeps the release brief on one route with stable selectors.");
      await snapshot({ name: "launch-checklist" });
    });

    await chapter("QA Sign-off", { id: "qa-sign-off" });

    await step("Reveal the QA sign-off panel", async () => {
      await page.goto(new URL("#qa-signoff", page.url()).href);
      await page.getByRole("heading", { name: "QA sign-off" }).waitFor();
      await narrate("A second state change is enough to prove the tour stays grounded in real app behavior.");
      await snapshot({ name: "qa-signoff" });
    });
  },
});
