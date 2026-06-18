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
            durationMs: 4_000,
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
          await gestureAroundLocator(page, button);
          await page.waitForTimeout(450);
          await button.click();

          const status = page.getByRole("status").getByText("Hope you enjoyed the video!");
          await status.waitFor();
          await highlight(status, {
            durationMs: 4_000,
            paddingPx: 12,
            style: "spotlight",
          });
        },
      );
      await snapshot({ name: "finale" });
    });
  },
});

async function gestureAroundLocator(
  page: Parameters<Parameters<typeof defineTour>[0]["run"]>[0]["page"],
  locator: Parameters<Parameters<Parameters<typeof defineTour>[0]["run"]>[0]["highlight"]>[0],
): Promise<void> {
  const box = await locator.boundingBox();

  if (box === null) {
    return;
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const radiusX = box.width / 2 + 24;
  const radiusY = box.height / 2 + 20;

  await page.mouse.move(centerX - radiusX - 120, centerY - radiusY - 40, { steps: 18 });
  await page.waitForTimeout(180);
  await page.mouse.move(centerX, centerY, { steps: 28 });
  await page.waitForTimeout(220);

  for (let index = 0; index <= 24; index += 1) {
    const angle = (Math.PI * 2 * index) / 24;
    await page.mouse.move(
      centerX + Math.cos(angle) * radiusX,
      centerY + Math.sin(angle) * radiusY,
      { steps: 2 },
    );
    await page.waitForTimeout(24);
  }

  await page.waitForTimeout(180);
  await page.mouse.move(centerX, centerY, { steps: 18 });
}
