import { z } from 'zod';

export const organizationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['empresa', 'proveedor', 'cliente']),
  status: z.string().optional(),
  logo_url: z.string().url().optional().nullable()
}); 