// Disposable starter tour: replace this smoke path with your own product demo.
export default {
  id: "sample-smoke",
  title: "DemoHunter starter smoke test",
  async run({ page }: { page: { getByRole: Function; getByText: Function } }) {
    await page.getByRole("heading", { name: "DemoHunter sample page" }).waitFor();
    await page.getByRole("button", { name: "Start demo" }).click();
    await page.getByText("Step complete").waitFor();
  },
};
