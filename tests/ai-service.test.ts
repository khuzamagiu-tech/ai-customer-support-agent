import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCustomerIntent, detectPriority, draftSupportResponse } from '../apps/api/src/services/aiService';

test('classifyCustomerIntent identifies billing issues without OpenAI', async () => {
  const result = await classifyCustomerIntent('I was charged twice for my subscription and need a refund');

  assert.equal(result.intent, 'billing_issue');
  assert.ok(result.confidence >= 0.5);
});

test('detectPriority flags urgent account-impacting issues', async () => {
  const result = await detectPriority('Our payment system is down and customers cannot place orders');

  assert.equal(result.priority, 'urgent');
  assert.ok(result.confidence >= 0.5);
});

test('draftSupportResponse provides a helpful response with references', async () => {
  const result = await draftSupportResponse({
    message: 'I need help with a refund after a duplicate charge.',
    context: 'Customer is upset and asks for fast resolution.',
    intent: 'billing_issue',
    priority: 'high',
    knowledgeArticles: [{ title: 'Refund policy exceptions', content: 'Refunds are allowed within 7 days for duplicate charges.', category: 'billing' }],
  });

  assert.ok(result.suggestedResponse.length > 20);
  assert.ok(result.references.length >= 1);
});
