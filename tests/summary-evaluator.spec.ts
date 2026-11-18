import { test, expect } from '@playwright/test';
import { evaluateSummary } from '../app/summary-evaluator.js';

const ticketMessages = [
  { id: 'm1', text: 'My package is delayed.' },
  { id: 'm2', text: 'Please share an update.' },
];

test('accepts a non-empty summary citing a message from this ticket', () => {
  //Arrange
  const summary = {
    text: 'The customer reports a delayed package.',
    sourceIds: ['m1'],
  };

  //Act
  const evaluation = evaluateSummary(summary, ticketMessages);

  //Assert
  expect(evaluation).toEqual({ eligible: true, reasons: [] });
});

test('rejects missing and cross-ticket citations', () => {
  //Arrange
  const summaries = [
    { text: 'There is a delay.', sourceIds: [] },
    { text: 'There is a delay.', sourceIds: ['other-ticket-m1'] },
  ];

  //Act
  const evaluations = summaries.map((summary) =>
    evaluateSummary(summary, ticketMessages),
  );

  //Assert
  expect(evaluations[0].eligible).toBe(false);
  expect(evaluations[0].reasons).toContain(
    'Summary must cite at least one ticket message.',
  );
  expect(evaluations[1].eligible).toBe(false);
  expect(evaluations[1].reasons).toContain(
    'Summary cites a message that is not part of this ticket.',
  );
});

test('rejects summaries that expose email addresses or phone numbers', () => {
  //Arrange
  const summary = {
    text: 'Contact the customer at alex@example.com about the delay.',
    sourceIds: ['m1'],
  };

  //Act
  const evaluation = evaluateSummary(summary, ticketMessages);

  //Assert
  expect(evaluation.eligible).toBe(false);
  expect(evaluation.reasons).toContain(
    'Summary may expose personal contact information.',
  );
});

test('rejects empty summaries', () => {
  //Arrange
  const summary = {
    text: '   ',
    sourceIds: ['m1'],
  };

  //Act
  const evaluation = evaluateSummary(summary, ticketMessages);

  //Assert
  expect(evaluation.eligible).toBe(false);
  expect(evaluation.reasons).toContain('Summary must not be empty.');
});

test('rejects summaries that expose phone numbers', () => {
  //Arrange
  const summary = {
    text: 'Call the customer at +1 (555) 123-4567 about the delay.',
    sourceIds: ['m1'],
  };

  //Act
  const evaluation = evaluateSummary(summary, ticketMessages);

  //Assert
  expect(evaluation.eligible).toBe(false);
  expect(evaluation.reasons).toContain(
    'Summary may expose personal contact information.',
  );
});
