import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "phase-03-generation",
  title: "Phase 3 generation contract",
  async setup({ page }) {
    await page.getByLabel("Email").fill("demo@demohunter.dev");
    await page.getByLabel("Password").fill("demo-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("heading", { name: "Workspace home" }).waitFor();
  },
  async run({ page, chapter, step, narrate, waitForStable, highlight, snapshot, assertVisible }) {
    await chapter("Workspace Overview", { id: "workspace-overview" });

    await step("Open the billing workspace", async () => {
      const billingButton = page.getByRole("button", { name: "Open billing workspace" });
      await highlight(billingButton, {
        name: "billing-workspace-button",
        paddingPx: 12,
      });
      await billingButton.click();
      await waitForStable({ state: "load", timeoutMs: 1_000 });
      await assertVisible(page.getByRole("heading", { name: "Billing workspace" }), {
        timeoutMs: 1_000,
      });
      await narrate("The billing workspace keeps current invoices and exports in one place.");
      await snapshot({ name: "billing-workspace" });
    });

    await chapter("Payment History", { id: "payment-history" });

    await step("Reveal the payment history", async () => {
      const paymentHistoryButton = page.getByRole("button", { name: "Reveal payment history" });
      await highlight(paymentHistoryButton, {
        name: "payment-history-button",
        paddingPx: 12,
      });
      await paymentHistoryButton.click();
      await waitForStable({ state: "load", timeoutMs: 1_000 });
      await assertVisible(page.getByRole("heading", { name: "Payment history" }), {
        timeoutMs: 1_000,
      });
      await narrate("Recorded playback stays strict while the chapter overlay briefly labels each section.");
      await snapshot({ name: "payment-history" });
    });
  },
  async teardown({ page }) {
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: "Sign in" }).waitFor();
  },
});
