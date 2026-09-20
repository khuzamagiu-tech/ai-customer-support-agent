import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  companyName: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const result = await query<{ id: string; name: string; email: string; company_name: string; status: string; created_at: string }>(
    'SELECT id, name, email, company_name, status, created_at FROM customers ORDER BY created_at DESC',
  );

  return res.json({ customers: result.rows });
});

router.post('/', async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid customer payload', details: parsed.error.flatten() });
  }

  const { name, email, companyName, status } = parsed.data;

  try {
    const result = await query<{ id: string }>(
      'INSERT INTO customers (name, email, company_name, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, companyName || null, status],
    );

    return res.status(201).json({ customer: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to create customer' });
  }
});

router.get('/:id', async (req, res) => {
  const result = await query<{ id: string; name: string; email: string; company_name: string; status: string }>(
    'SELECT id, name, email, company_name, status FROM customers WHERE id = $1',
    [req.params.id],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  return res.json({ customer: result.rows[0] });
});

export default router;
