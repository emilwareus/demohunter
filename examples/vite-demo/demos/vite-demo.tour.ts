import { defineTour } from "demohunter";

export default defineTour({
  id: "vite-demo",
  title: "Vite OSS example",
  async run({ page, chapter, step, narrate, narrateWhile, highlight, snapshot }) {
    await chapter("Welcome", { id: "welcome" });

    await step("Greet the viewer", async () => {
      await page.getByRole("heading", { name: "Hello DemoHunter!" }).waitFor();
      await narrateWhile(
        "Welcome to DemoHunter. A lightweight Vite app is enough to record a narrated tour locally.",
        async () => {
          await highlight(page.getByRole("heading", { name: "Hello DemoHunter!" }), {
            style: "ring",
          });
        },
      );
      await snapshot({ name: "hello" });
    });

    await chapter("Finale", { id: "finale" });

    await step("Reveal the finale", async () => {
      await page.getByRole("button", { name: "Show the finale" }).click();
      await page.getByRole("status").getByText("Hope you enjoyed the video!").waitFor();
      await narrateWhile(
        "One click reveals the finale, and the portable output lands in dot demohunter, ready to replay.",
        async () => {
          await highlight(page.getByRole("status"), { style: "spotlight", paddingPx: 12 });
        },
      );
      await snapshot({ name: "finale" });
    });
  },
});
