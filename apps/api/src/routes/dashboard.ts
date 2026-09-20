import { Router } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/summary', async (_req, res) => {
  const result = await query<{ open_conversations: number; resolved_today: number; high_priority: number; active_customers: number }>(
    `SELECT
      (SELECT COUNT(*) FROM conversations WHERE status NOT IN ('resolved', 'closed')) AS open_conversations,
      (SELECT COUNT(*) FROM conversations WHERE status = 'resolved' AND created_at >= NOW() - INTERVAL '1 day') AS resolved_today,
      (SELECT COUNT(*) FROM conversations WHERE priority IN ('high', 'urgent')) AS high_priority,
      (SELECT COUNT(*) FROM customers WHERE status = 'active') AS active_customers;`,
  );

  const data = result.rows[0];
  return res.json({
    summary: {
      openConversations: Number(data?.open_conversations || 0),
      resolvedToday: Number(data?.resolved_today || 0),
      highPriority: Number(data?.high_priority || 0),
      activeCustomers: Number(data?.active_customers || 0),
    },
  });
});

export default router;
