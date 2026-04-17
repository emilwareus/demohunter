import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "nextjs-demo",
  title: "Next.js OSS example",
  async run({ page, chapter, step, narrate, snapshot }) {
    await chapter("Welcome", { id: "welcome" });

    await step("Greet the viewer", async () => {
      await page.getByRole("heading", { name: "Hello DemoHunter!" }).waitFor();
      await narrate("Welcome to DemoHunter. A tiny Next.js page is all we need to show a narrated tour.");
      await snapshot({ name: "hello" });
    });

    await chapter("Finale", { id: "finale" });

    await step("Reveal the finale", async () => {
      await page.getByRole("button", { name: "Show the finale" }).click();
      await page.getByRole("status").getByText("Hope you enjoyed the video!").waitFor();
      await narrate("One click reveals the finale, proving DemoHunter captures real state changes and narrates them.");
      await snapshot({ name: "finale" });
    });
  },
});
