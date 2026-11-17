import { test, expect } from './fixtures/support-dashboard.fixture.js';

test('generates and approves a correctly attributed summary', async ({
  page,
  supportDashboard,
}) => {
  //Arrange
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        summary: 'The customer reports a delayed package and requests an update.',
        sourceIds: ['m1'],
      }),
    });
  });

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await expect(page.getByTestId('summary')).toContainText('delayed package');
  await expect(page.getByTestId('generation-status')).toHaveText('Summary ready');
  await expect(page.getByTestId('approve-summary')).toBeEnabled();

  //Act
  await supportDashboard.approveSummary();

  //Assert
  await expect(page.getByTestId('generation-status')).toHaveText('Summary approved');
});

test('shows insufficient information and keeps approval disabled', async ({
  page,
  supportDashboard,
}) => {
  //Arrange
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'insufficient_information' }),
    });
  });

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await expect(page.getByTestId('generation-status')).toHaveText(
    'Insufficient information to generate a summary.',
  );
  await expect(page.getByTestId('approve-summary')).toBeDisabled();
});

test('offers retry after a service error and enables approval after a valid retry', async ({
  page,
  supportDashboard,
}) => {
  //Arrange
  let requestCount = 0;
  await page.route('**/api/generate', async (route) => {
    requestCount += 1;
    if (requestCount === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'unavailable' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        summary: 'The customer reports a delayed package.',
        sourceIds: ['m2'],
      }),
    });
  });

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await expect(page.getByTestId('generation-status')).toHaveText(
    'Generation failed. Please retry.',
  );
  await expect(page.getByTestId('generate-summary')).toHaveText('Retry generation');
  await expect(page.getByTestId('approve-summary')).toBeDisabled();

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await expect(page.getByTestId('generation-status')).toHaveText('Summary ready');
  await expect(page.getByTestId('approve-summary')).toBeEnabled();
  expect(requestCount).toBe(2);
});

test('blocks approval when the generated summary cites another ticket', async ({
  page,
  supportDashboard,
}) => {
  //Arrange
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        summary: 'The customer reports a delayed package.',
        sourceIds: ['m1', 'foreign-message'],
      }),
    });
  });

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await expect(page.getByTestId('summary')).toContainText('delayed package');
  await expect(page.getByTestId('generation-status')).toHaveText(
    'Summary is not eligible for approval: Summary cites a message that is not part of this ticket.',
  );
  await expect(page.getByTestId('approve-summary')).toBeDisabled();
});

test('blocks approval when a summary exposes personal contact information', async ({
  page,
  supportDashboard,
}) => {
  //Arrange
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        summary: 'Contact alex@example.com about the delayed package.',
        sourceIds: ['m1'],
      }),
    });
  });

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await expect(page.getByTestId('generation-status')).toHaveText(
    'Summary is not eligible for approval: Summary may expose personal contact information.',
  );
  await expect(page.getByTestId('approve-summary')).toBeDisabled();
});
