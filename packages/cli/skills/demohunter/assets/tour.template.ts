import { defineTour } from "demohunter";

export default defineTour({
  id: "product-overview",
  title: "Product overview",
  async run({ page, chapter, step, narrate, waitForStable, snapshot }) {
    await chapter("Overview", { id: "overview" });

    await step("Open the overview page", async () => {
      await page.goto("/");
      await waitForStable();
      await page.getByRole("heading", { name: "Product overview" }).waitFor();
      await narrate("This page introduces the core workflow before deeper feature steps.");
      await snapshot({ name: "product-overview" });
    });
  },
});
