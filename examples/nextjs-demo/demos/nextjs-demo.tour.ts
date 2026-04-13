import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "nextjs-demo",
  title: "Next.js OSS example",
  async run({ page, chapter, step, narrate, waitForStable, assertVisible, snapshot }) {
    await chapter("Release Brief", { id: "release-brief" });

    await step("Open the launch checklist", async () => {
      await page.getByRole("button", { name: "Show launch checklist" }).click();
      await waitForStable({ state: "load", timeoutMs: 1_000 });
      await assertVisible(page.getByRole("heading", { name: "Launch checklist" }), {
        timeoutMs: 1_000,
      });
      await narrate("The Next.js example keeps the release brief on one route with stable selectors.");
      await snapshot({ name: "launch-checklist" });
    });

    await chapter("QA Sign-off", { id: "qa-sign-off" });

    await step("Reveal the QA sign-off panel", async () => {
      await page.getByRole("button", { name: "Reveal QA sign-off" }).click();
      await waitForStable({ state: "load", timeoutMs: 1_000 });
      await assertVisible(page.getByRole("heading", { name: "QA sign-off" }), {
        timeoutMs: 1_000,
      });
      await narrate("A second state change is enough to prove the tour stays grounded in real app behavior.");
      await snapshot({ name: "qa-signoff" });
    });
  },
});
