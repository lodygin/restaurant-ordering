import { registerAs } from '@nestjs/config';

import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.url().default('http://localhost:4200'),
});

export default registerAs('app', () => schema.parse(process.env));
