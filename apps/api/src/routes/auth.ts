import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { createToken, hashPassword, comparePassword } from '../services/authService';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid login payload', details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const result = await query<{ id: string; email: string; password_hash: string; role: string; name: string }>(
      'SELECT id, email, name, password_hash, role FROM admins WHERE email = $1 AND is_active = true',
      [email],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const validPassword = await comparePassword(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken({ id: admin.id, email: admin.email, role: admin.role });
    return res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to log in' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await query<{ id: string; email: string; name: string; role: string }>(
      'SELECT id, email, name, role FROM admins WHERE id = $1',
      [req.user?.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.json({ admin: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load profile' });
  }
});

export default router;
