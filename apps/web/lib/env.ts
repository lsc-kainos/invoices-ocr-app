import { z } from 'zod';

const schema = z.object({
  API_URL: z.string().url().default('http://localhost:3001'),
});

export const env = schema.parse({
  API_URL: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
});
