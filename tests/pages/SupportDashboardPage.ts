import type { Locator, Page } from '@playwright/test';

export class SupportDashboardPage {
  private readonly generateButton: Locator;
  private readonly approveButton: Locator;
  private readonly summary: Locator;
  private readonly status: Locator;

  /** Creates page-object locators for the support dashboard. */
  constructor(private readonly page: Page) {
    this.generateButton = page.getByTestId('generate-summary');
    this.approveButton = page.getByTestId('approve-summary');
    this.summary = page.getByTestId('summary');
    this.status = page.getByTestId('generation-status');
  }

  /** Opens the local synthetic support dashboard. */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** Requests a summary for the displayed ticket. */
  async generateSummary(): Promise<void> {
    await this.generateButton.click();
  }

  /** Approves the displayed summary when the UI allows it. */
  async approveSummary(): Promise<void> {
    await this.approveButton.click();
  }

  /** Returns the visible summary text. */
  async getSummaryText(): Promise<string> {
    return (await this.summary.textContent()) ?? '';
  }

  /** Returns the visible generation or approval status. */
  async getStatusText(): Promise<string> {
    return (await this.status.textContent()) ?? '';
  }

  /** Reports whether summary approval is currently enabled. */
  async isApprovalEnabled(): Promise<boolean> {
    return this.approveButton.isEnabled();
  }
}
