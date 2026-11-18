# Playwright AI-summary release gate

A small TypeScript and Playwright project for a synthetic support-ticket summary flow. It runs locally without credentials, paid services, or external AI calls. The browser talks to a local deterministic HTTP service; tests can independently mock that boundary per browser context.

## Setup and run

Requirements: Node.js 22+ and npm.

```sh
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

For the Playwright interactive runner, use `npm run test:ui`.

## What's covered

- Successful summary generation, citation validation, and approval.
- Summaries with missing citations or empty text that must not be approved.
- An insufficient-information service response that keeps approval disabled.
- A `503` service error followed by a successful retry.
- A malformed summary with a cross-ticket citation that must not be approved.
- Summaries containing an email address or phone number that must not be approved.
- Deterministic evaluator checks for missing/foreign citations, empty text, and email/phone leakage.

Page interactions live in `tests/pages/SupportDashboardPage.ts`; each test gets an isolated Playwright page and its own mocked service response, so tests can run in parallel. The tiny local server in `server.mjs` provides a deterministic success response when the app is opened outside the tests.

## Release-blocking criteria

The GitHub Actions workflow runs the TypeScript check and the complete Chromium test suite on pushes and pull requests. Either failing check blocks the `release-gate` job. On failure, CI retains the Playwright HTML report as an artifact.

## Deliberate failure exercise

To observe an intentional regression, temporarily reverse the membership check in `app/summary-evaluator.js` from `!messageIds.has(sourceId)` to `messageIds.has(sourceId)`, then run `npm test`. The valid-summary and cross-ticket-citation tests will fail. Restore the original condition before submitting changes.

## Scope and next steps

The evaluator checks citation membership, presence of a citation and non-empty text, and a basic email/phone leakage pattern. It does not prove that the summary accurately captures meaning, avoids subtler unsupported claims, or detects every sensitive-data format. Those checks need broader adversarial fixtures and, separately, evaluation against a live model with human-reviewed examples; deterministic tests alone cannot establish live-model quality.

AI assistance was used to scaffold the project and test cases. The local type-check and browser tests were used to verify the generated output; no external model or credential is needed to run them.
