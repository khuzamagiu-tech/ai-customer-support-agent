import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { classifyCustomerIntent, detectPriority, draftSupportResponse } from '../services/aiService';

const router = Router();

const aiSchema = z.object({
  message: z.string().min(1),
  context: z.string().optional(),
  knowledgeArticles: z.array(z.object({
    title: z.string(),
    content: z.string(),
    category: z.string(),
  })).optional(),
});

router.use(requireAuth);

router.post('/classify-intent', async (req, res) => {
  const parsed = aiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid AI payload', details: parsed.error.flatten() });
  }

  const result = await classifyCustomerIntent(parsed.data.message, parsed.data.context || '');
  return res.json({ success: true, ...result });
});

router.post('/detect-priority', async (req, res) => {
  const parsed = aiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid AI payload', details: parsed.error.flatten() });
  }

  const result = await detectPriority(parsed.data.message, parsed.data.context || '');
  return res.json({ success: true, ...result });
});

router.post('/generate-response', async (req, res) => {
  const parsed = aiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid AI payload', details: parsed.error.flatten() });
  }

  const result = await draftSupportResponse({
    message: parsed.data.message,
    context: parsed.data.context,
    knowledgeArticles: parsed.data.knowledgeArticles || [],
  });

  return res.json({ success: true, ...result });
});

export default router;
