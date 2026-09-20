import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { hashPassword } from '../services/authService';

const router = Router();

const adminCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'manager', 'agent']).default('agent'),
});

router.use(requireAuth);

router.get('/profile', async (req: AuthRequest, res) => {
  const result = await query<{ id: string; email: string; name: string; role: string }>(
    'SELECT id, email, name, role FROM admins WHERE id = $1',
    [req.user?.id],
  );

  return res.json({ admin: result.rows[0] || null });
});

router.post('/', requireRole(['admin']), async (req, res) => {
  try {
    const parsed = adminCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid admin payload', details: parsed.error.flatten() });
    }

    const { name, email, password, role } = parsed.data;
    const passwordHash = await hashPassword(password);

    const result = await query<{ id: string; email: string; name: string; role: string }>(
      `INSERT INTO admins (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [name, email, passwordHash, role],
    );

    return res.status(201).json({ admin: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to create admin' });
  }
});

export default router;
