# Playwright AI-summary release gate

## Purpose

This repository demonstrates a Playwright and TypeScript release gate for a synthetic support-ticket summary workflow. The test application uses a deterministic local service, while UI tests mock that service to exercise success, error, and invalid-summary scenarios without credentials, paid services, or external AI calls.

## Project structure

```text
.
|-- .github/
|   `-- workflows/
|       `-- playwright.yml            # CI checks and report/video artifact upload
|-- app/
|   |-- index.html                    # Synthetic support dashboard and UI behavior
|   `-- summary-evaluator.js          # Deterministic summary eligibility checks
|-- tests/
|   |-- fixtures/
|   |   `-- support-dashboard.fixture.ts # Opens a fresh dashboard for each test
|   |-- pages/
|   |   `-- SupportDashboardPage.ts   # Page object: dashboard locators and actions
|   |-- generation.spec.ts            # UI tests with mocked API responses
|   `-- summary-evaluator.spec.ts     # Direct evaluator unit tests
|-- playwright.config.ts              # Browser, server, reporter, and video settings
|-- server.mjs                        # Local static server and deterministic API
|-- tsconfig.json                     # TypeScript checks
`-- package.json                      # Commands and development dependencies
```

## Application preview

This is a small synthetic test application used to evaluate the Playwright test framework, not a production support dashboard. It displays a sample ticket, generates a deterministic summary through the local service, and enables approval only when the summary passes citation and contact-data checks.

![Support dashboard showing a generated summary ready for approval](./support-dashboard.png)

## Setup and run

Requirements: Node.js 22+ and npm.

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

For the Playwright interactive runner, use `npm run test:ui`.

Page interactions live in `tests/pages/SupportDashboardPage.ts`; each test gets an isolated Playwright page and its own mocked service response, so tests can run in parallel. The tiny local server in `server.mjs` provides a deterministic success response when the app is opened outside the tests.

Detailed scenarios and expected outcomes are listed on the [Test Cases wiki page](https://github.com/RahulDugger/playwright-ai-summary-release-gate/wiki/Test-Cases).

## Release-blocking criteria

The GitHub Actions workflow runs the TypeScript check and the complete Chromium test suite on pushes and pull requests. Either failing check blocks the `release-gate` job. Each run uploads the Playwright HTML report and test results, including a video for every test, as the `playwright-report-and-videos` artifact. Download it from the completed workflow run on GitHub Actions; open `playwright-report/index.html` to review the report and the videos under `test-results/`.

## Deliberate failure exercise

To observe an intentional regression, temporarily reverse the membership check in `app/summary-evaluator.js` from `!messageIds.has(sourceId)` to `messageIds.has(sourceId)`, then run `npm test`. The valid-summary and cross-ticket-citation tests will fail. Restore the original condition before submitting changes.

## Scope and next steps

The evaluator checks citation membership, presence of a citation and non-empty text, and a basic email/phone leakage pattern. It does not prove that the summary accurately captures meaning, avoids subtler unsupported claims, or detects every sensitive-data format. Those checks need broader adversarial fixtures and, separately, evaluation against a live model with human-reviewed examples; deterministic tests alone cannot establish live-model quality.
