import { test, expect } from './fixtures/support-dashboard.fixture.js';

// Validate that a correctly cited summary can be approved.
// Route the generation request to return a valid summary citing m1.
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
  await supportDashboard.expectStatus('Summary ready');
  const generatedSummary = await supportDashboard.getSummaryText();
  const approvalEnabledBeforeClick =
    await supportDashboard.isApprovalEnabled();
  await supportDashboard.approveSummary();
  await supportDashboard.expectStatus('Summary approved');

  //Assert
  expect(generatedSummary).toContain('delayed package');
  expect(approvalEnabledBeforeClick).toBe(true);
  await supportDashboard.expectStatus('Summary approved');
  await supportDashboard.expectApprovalDisabled();
});

// Validate that insufficient information keeps summary approval disabled.
// Route the generation request to return an insufficient-information response.
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
  await supportDashboard.expectStatus(
    'Insufficient information to generate a summary.',
  );
  await supportDashboard.expectApprovalDisabled();
});

// Validate that a failed generation can be retried and then approved.
// Route the first request to return 503 and the retry to return a valid summary.
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
  await supportDashboard.expectGenerateButtonText('Retry generation');
  const failedStatus = await supportDashboard.getStatusText();
  const approvalDisabledAfterFailure =
    !(await supportDashboard.isApprovalEnabled());

  await supportDashboard.generateSummary();
  await supportDashboard.expectStatus('Summary ready');

  //Assert
  expect(failedStatus).toBe('Generation failed. Please retry.');
  expect(approvalDisabledAfterFailure).toBe(true);
  await supportDashboard.expectStatus('Summary ready');
  await supportDashboard.expectApprovalEnabled();
  expect(requestCount).toBe(2);
});

// Validate that a summary citing another ticket cannot be approved.
// Route the generation request to return both a valid citation and a foreign citation.
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
  await supportDashboard.expectSummaryToContain('delayed package');
  await supportDashboard.expectStatus(
    'Summary is not eligible for approval: Summary cites a message that is not part of this ticket.',
  );
  await supportDashboard.expectApprovalDisabled();
});

// Validate that a summary containing an email address cannot be approved.
// Route the generation request to return a summary containing an email address.
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
  await supportDashboard.expectStatus(
    'Summary is not eligible for approval: Summary may expose personal contact information.',
  );
  await supportDashboard.expectApprovalDisabled();
});

// Validate that a summary without citations cannot be approved.
// Route the generation request to return a summary with an empty sourceIds array.
test('blocks approval when the generated summary has no citation', async ({
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
        sourceIds: [],
      }),
    });
  });

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await supportDashboard.expectStatus(
    'Summary is not eligible for approval: Summary must cite at least one ticket message.',
  );
  await supportDashboard.expectApprovalDisabled();
});

// Validate that a summary containing a phone number cannot be approved.
// Route the generation request to return a summary containing a phone number.
test('blocks approval when a summary exposes a phone number', async ({
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
        summary: 'Call the customer at +1 (555) 123-4567 about the delay.',
        sourceIds: ['m1'],
      }),
    });
  });

  //Act
  await supportDashboard.generateSummary();

  //Assert
  await supportDashboard.expectStatus(
    'Summary is not eligible for approval: Summary may expose personal contact information.',
  );
  await supportDashboard.expectApprovalDisabled();
});
