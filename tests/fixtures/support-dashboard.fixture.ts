/**
 * Provides each Playwright test with a page object for a freshly opened
 * support dashboard, keeping browser interactions isolated and parallel-safe.
 */
import { test as base, expect } from '@playwright/test';
import { SupportDashboardPage } from '../pages/SupportDashboardPage.js';

interface SupportDashboardFixtures {
  supportDashboard: SupportDashboardPage;
}

export const test = base.extend<SupportDashboardFixtures>({
  /** Provides a fresh dashboard page per test for parallel-safe isolation. */
  supportDashboard: async ({ page }, use) => {
    const supportDashboard = new SupportDashboardPage(page);
    await supportDashboard.goto();
    await use(supportDashboard);
  },
});

export { expect };
