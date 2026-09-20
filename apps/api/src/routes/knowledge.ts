import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const articleSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

router.use(requireAuth);

router.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const result = await query<{ id: string; title: string; category: string; status: string; tags: string[] }>(
    search
      ? `SELECT id, title, category, status, tags
         FROM knowledge_articles
         WHERE status != 'archived'
           AND (
             title ILIKE $1 OR
             content ILIKE $1 OR
             category ILIKE $1 OR
             tags::text ILIKE $1
           )
         ORDER BY updated_at DESC`
      : 'SELECT id, title, category, status, tags FROM knowledge_articles ORDER BY updated_at DESC',
    search ? [`%${search}%`] : [],
  );

  return res.json({ articles: result.rows });
});

router.post('/', async (req, res) => {
  const parsed = articleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid article payload', details: parsed.error.flatten() });
  }

  const { title, content, category, tags, status } = parsed.data;
  const result = await query<{ id: string }>(
    'INSERT INTO knowledge_articles (title, content, category, tags, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [title, content, category, tags, status],
  );

  return res.status(201).json({ article: result.rows[0] });
});

router.get('/:id', async (req, res) => {
  const result = await query<{ id: string; title: string; content: string; category: string; tags: string[]; status: string }>(
    'SELECT id, title, content, category, tags, status FROM knowledge_articles WHERE id = $1',
    [req.params.id],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }

  return res.json({ article: result.rows[0] });
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const parsed = articleSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid article update payload', details: parsed.error.flatten() });
  }

  const { title, content, category, tags, status } = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [];

  if (title) { fields.push('title = $' + (values.length + 1)); values.push(title); }
  if (content) { fields.push('content = $' + (values.length + 1)); values.push(content); }
  if (category) { fields.push('category = $' + (values.length + 1)); values.push(category); }
  if (tags) { fields.push('tags = $' + (values.length + 1)); values.push(tags); }
  if (status) { fields.push('status = $' + (values.length + 1)); values.push(status); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid article fields provided' });
  }

  const result = await query(
    `UPDATE knowledge_articles
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length + 1}
     RETURNING id`,
    [...values, req.params.id],
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }

  return res.json({ success: true, articleId: req.params.id });
});

router.delete('/:id', async (req, res) => {
  const result = await query('DELETE FROM knowledge_articles WHERE id = $1 RETURNING id', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }

  return res.json({ success: true });
});

export default router;
