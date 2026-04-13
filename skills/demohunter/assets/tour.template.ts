import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "replace-with-tour-id",
  title: "Replace with a short demo title",
  async run({ page, chapter, step, narrate, waitForStable, snapshot }) {
    await chapter("Replace chapter title", { id: "replace-chapter-id" });

    await step("Open the target screen", async () => {
      await page.goto("/");
      await waitForStable();
      await page.getByRole("heading", { name: "Replace visible heading" }).waitFor();
      await narrate("Describe the user-visible product change in one or two concise sentences.");
      await snapshot({ name: "replace-visible-heading" });
    });
  },
});
