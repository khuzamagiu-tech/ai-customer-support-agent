import { z } from 'zod';

export const objectIdSchema = z.string().min(1, 'Value is required');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
