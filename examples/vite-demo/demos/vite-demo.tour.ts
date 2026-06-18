import { defineTour } from "demohunter";

export default defineTour({
  id: "vite-demo",
  title: "Vite OSS example",
  async run({ page, chapter, step, narrate, narrateWhile, highlight, snapshot }) {
    await chapter("Welcome", { id: "welcome" });

    await step("Greet the viewer", async () => {
      const heading = page.getByRole("heading", { name: "Hello DemoHunter!" });
      await heading.waitFor();
      await narrateWhile(
        "This showcase video is demonstrating DemoHunter's recording effects. The blue ring around the heading is a Pass 2 highlight, added only to the video while the strict replay timeline stays unchanged.",
        async () => {
          await highlight(heading, {
            durationMs: 1_400,
            paddingPx: 10,
            style: "ring",
          });
        },
      );
      await snapshot({ name: "hello" });
    });

    await chapter("Finale", { id: "finale" });

    await step("Reveal the finale", async () => {
      const button = page.getByRole("button", { name: "Show the finale" });
      await narrateWhile(
        "Now watch the injected cursor move to the button. The click creates a visible ripple, then the spotlight highlight dims the page and cuts out the result message.",
        async () => {
          await moveMouseToLocator(page, button);
          await page.waitForTimeout(300);
          await button.click();

          const status = page.getByRole("status").getByText("Hope you enjoyed the video!");
          await status.waitFor();
          await highlight(status, {
            durationMs: 1_800,
            paddingPx: 12,
            style: "spotlight",
          });
        },
      );
      await snapshot({ name: "finale" });
    });
  },
});

async function moveMouseToLocator(
  page: Parameters<Parameters<typeof defineTour>[0]["run"]>[0]["page"],
  locator: Parameters<Parameters<Parameters<typeof defineTour>[0]["run"]>[0]["highlight"]>[0],
): Promise<void> {
  const box = await locator.boundingBox();

  if (box === null) {
    return;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
}
