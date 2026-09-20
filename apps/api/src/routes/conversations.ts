import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const conversationSchema = z.object({
  customerId: z.string().min(1),
  subject: z.string().min(2),
  status: z.enum(['new', 'open', 'pending', 'resolved', 'closed']).default('new'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  source: z.enum(['email', 'chat', 'portal', 'phone']).default('email'),
});

const messageSchema = z.object({
  senderType: z.enum(['customer', 'admin', 'ai']).default('customer'),
  senderId: z.string().optional(),
  body: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const result = await query<{ id: string; subject: string; status: string; priority: string; customer_id: string }>(
    'SELECT id, subject, status, priority, customer_id FROM conversations ORDER BY last_message_at DESC',
  );

  return res.json({ conversations: result.rows });
});

router.post('/', async (req, res) => {
  const parsed = conversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid conversation payload', details: parsed.error.flatten() });
  }

  const { customerId, subject, status, priority, source } = parsed.data;
  const result = await query<{ id: string }>(
    'INSERT INTO conversations (customer_id, subject, status, priority, source) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [customerId, subject, status, priority, source],
  );

  return res.status(201).json({ conversation: result.rows[0] });
});

router.get('/:id/messages', async (req, res) => {
  const result = await query<{ id: string; body: string; sender_type: string; sender_id: string; created_at: string }>(
    'SELECT id, body, sender_type, sender_id, created_at FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [req.params.id],
  );

  return res.json({ messages: result.rows });
});

router.post('/:id/messages', async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid message payload', details: parsed.error.flatten() });
  }

  const { senderType, senderId, body, metadata } = parsed.data;
  const result = await query<{ id: string }>(
    'INSERT INTO conversation_messages (conversation_id, sender_type, sender_id, body, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [req.params.id, senderType, senderId || null, body, metadata || null],
  );

  return res.status(201).json({ message: result.rows[0] });
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  const status = z.enum(['new', 'open', 'pending', 'resolved', 'closed']).safeParse(req.body.status);
  if (!status.success) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = await query(
    'UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
    [status.data, req.params.id],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  return res.json({ success: true });
});

export default router;
