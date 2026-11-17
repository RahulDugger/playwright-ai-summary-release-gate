/**
 * @typedef {{ id: string, text: string }} TicketMessage
 * @typedef {{ text: string, sourceIds: string[] }} GeneratedSummary
 * @typedef {{ eligible: boolean, reasons: string[] }} SummaryEvaluation
 */

const personalDataPattern =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:\+?\d[\d(). -]{7,}\d)\b/i;

/**
 * Checks that citations belong to the current ticket and screens for contact-data leakage.
 * @param {GeneratedSummary} summary
 * @param {TicketMessage[]} ticketMessages
 * @returns {SummaryEvaluation}
 */
export function evaluateSummary(summary, ticketMessages) {
  const messageIds = new Set(ticketMessages.map((message) => message.id));
  const reasons = [];

  if (summary.sourceIds.length === 0) {
    reasons.push('Summary must cite at least one ticket message.');
  } else if (summary.sourceIds.some((sourceId) => !messageIds.has(sourceId))) {
    reasons.push('Summary cites a message that is not part of this ticket.');
  }

  if (!summary.text.trim()) {
    reasons.push('Summary must not be empty.');
  }

  if (personalDataPattern.test(summary.text)) {
    reasons.push('Summary may expose personal contact information.');
  }

  return { eligible: reasons.length === 0, reasons };
}
