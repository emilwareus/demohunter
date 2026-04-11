import { defineTour } from "@demohunter/sdk";

export default defineTour({
  id: "phase-04-narration",
  title: "Phase 4 narration contract",
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
      await narrate("The billing workspace keeps invoices, exports, and credits together.");
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
      await narrate("Each replay stays strict because narration timing comes from cached audio.");
      await narrate("Caption files are emitted from narration segments only, not from overlay labels.");
      await snapshot({ name: "payment-history" });
    });
  },
  async teardown({ page }) {
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: "Sign in" }).waitFor();
  },
});
