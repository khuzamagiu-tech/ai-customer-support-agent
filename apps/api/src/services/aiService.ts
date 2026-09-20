import { env } from '../config/env';
import type { SupportPriority } from '@ai-customer-support-agent/shared';

export interface AIIntentResult {
  intent: string;
  confidence: number;
}

export interface AIPriorityResult {
  priority: SupportPriority;
  confidence: number;
}

export interface DraftResponseOptions {
  message: string;
  context?: string;
  intent?: string;
  priority?: SupportPriority;
  knowledgeArticles?: Array<{ title: string; content: string; category: string }>;
}

const FALLBACK_INTENTS = [
  { keywords: ['refund', 'charge', 'billing', 'invoice', 'payment', 'credit card', 'subscription'], intent: 'billing_issue', weight: 4 },
  { keywords: ['password', 'login', 'auth', 'access', 'account locked', 'sign in', 'reset'], intent: 'account_access', weight: 4 },
  { keywords: ['bug', 'error', 'broken', 'not working', 'crash', 'issue'], intent: 'technical_issue', weight: 3 },
  { keywords: ['delivery', 'shipment', 'order', 'tracking', 'package'], intent: 'order_status', weight: 3 },
  { keywords: ['cancel', 'subscription', 'stop', 'terminate'], intent: 'cancellation_request', weight: 3 },
  { keywords: ['feature', 'request', 'need', 'upgrade', 'custom', 'product'], intent: 'feature_request', weight: 2 },
  { keywords: ['refund', 'complaint', 'poor', 'disappointed'], intent: 'complaint', weight: 2 },
];

const FALLBACK_PRIORITY_RULES = [
  { keywords: ['urgent', 'outage', 'down', 'cannot access', 'security', 'breach', 'fraud', 'lost', 'chargeback'], priority: 'urgent' as const, weight: 5 },
  { keywords: ['vip', 'critical', 'impacting all customers', 'production', 'payment failed', 'billing error'], priority: 'high' as const, weight: 4 },
  { keywords: ['won’t work', 'not working', 'error', 'delayed', 'cancel', 'refund'], priority: 'high' as const, weight: 3 },
  { keywords: ['question', 'help', 'how do i', 'status'], priority: 'normal' as const, weight: 2 },
  { keywords: ['thanks', 'follow up', 'update'], priority: 'low' as const, weight: 1 },
];

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

function matchIntentFromText(text: string): AIIntentResult {
  const normalized = normalizeText(text);
  let bestIntent = 'general_inquiry';
  let bestScore = 0;

  FALLBACK_INTENTS.forEach(({ keywords, intent, weight }) => {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? weight : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  });

  const confidence = bestScore > 0 ? Math.min(0.92, 0.58 + bestScore * 0.08) : 0.53;
  return { intent: bestIntent, confidence: Number(confidence.toFixed(2)) };
}

function matchPriorityFromText(text: string): AIPriorityResult {
  const normalized = normalizeText(text);
  let bestPriority: SupportPriority = 'normal';
  let bestScore = 0;

  FALLBACK_PRIORITY_RULES.forEach(({ keywords, priority, weight }) => {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? weight : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestPriority = priority;
    }
  });

  const confidence = bestScore > 0 ? Math.min(0.96, 0.5 + bestScore * 0.09) : 0.56;
  return { priority: bestPriority, confidence: Number(confidence.toFixed(2)) };
}

async function callOpenAI<T>(
  systemMessage: string,
  userMessage: string,
): Promise<T | null> {
  if (!env.openAiApiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openAiModel,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    return JSON.parse(content) as T;
  } catch (error) {
    return null;
  }
}

export async function classifyCustomerIntent(message: string, context = ''): Promise<AIIntentResult> {
  const input = `${message}\n${context}`.trim();
  if (!input) {
    return { intent: 'general_inquiry', confidence: 0.5 };
  }

  const result = await callOpenAI<{ intent?: string; confidence?: number }>(
    'Return a JSON object with intent and confidence for the customer message. Use a short internal label like billing_issue, account_access, technical_issue, order_status, cancellation_request, feature_request, complaint, or general_inquiry.',
    input,
  );

  if (result?.intent) {
    return {
      intent: result.intent,
      confidence: Number((result.confidence ?? 0.7).toFixed(2)),
    };
  }

  return matchIntentFromText(input);
}

export async function detectPriority(message: string, context = ''): Promise<AIPriorityResult> {
  const input = `${message}\n${context}`.trim();
  if (!input) {
    return { priority: 'normal', confidence: 0.5 };
  }

  const result = await callOpenAI<{ priority?: SupportPriority; confidence?: number }>(
    'Return a JSON object with priority and confidence. Priority must be one of low, normal, high, or urgent.',
    input,
  );

  if (result?.priority && ['low', 'normal', 'high', 'urgent'].includes(result.priority)) {
    return {
      priority: result.priority,
      confidence: Number((result.confidence ?? 0.7).toFixed(2)),
    };
  }

  return matchPriorityFromText(input);
}

export async function draftSupportResponse({
  message,
  context = '',
  intent,
  priority,
  knowledgeArticles = [],
}: DraftResponseOptions): Promise<{ suggestedResponse: string; references: string[]; }> {
  const input = `${message}\n${context}`.trim();

  const knowledgeText = knowledgeArticles.length > 0
    ? knowledgeArticles.map((article) => `- ${article.title}: ${article.content}`).join('\n')
    : '';

  const result = await callOpenAI<{ suggestedResponse?: string; references?: string[] }>(
    'You are a helpful customer support agent. Draft a brief, empathetic, actionable response using the customer message and any provided knowledge. Return JSON with suggestedResponse and references array.',
    `Customer message: ${input}\n\nIntent: ${intent ?? 'general_inquiry'}\nPriority: ${priority ?? 'normal'}\nKnowledge:\n${knowledgeText}`,
  );

  if (result?.suggestedResponse) {
    return {
      suggestedResponse: result.suggestedResponse,
      references: result.references ?? knowledgeArticles.map((article) => article.title),
    };
  }

  const references = knowledgeArticles.map((article) => article.title);
  const normalizedMessage = normalizeText(input);
  const empathyLead = normalizedMessage.includes('angry') || normalizedMessage.includes('upset') || normalizedMessage.includes('frustrated')
    ? 'I understand this is frustrating.'
    : 'Thanks for reaching out.';

  const priorityText = priority === 'urgent' ? 'This is urgent, and I am escalating it for a fast review.'
    : priority === 'high' ? 'I am prioritizing this issue to get you a fast resolution.'
    : 'I am reviewing your request and will keep you updated.';

  const response = `${empathyLead} ${priorityText} I have reviewed the context for ${intent ?? 'general_inquiry'} and I recommend we follow the support steps below.\n\n${knowledgeArticles.length > 0 ? 'Relevant article: ' + knowledgeArticles[0].title + '.' : 'Please share any screenshots or details that would help us confirm the issue.'}`;

  return { suggestedResponse: response, references };
}
