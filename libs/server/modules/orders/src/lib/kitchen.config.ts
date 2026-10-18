import { registerAs } from '@nestjs/config';

import { z } from 'zod';

const schema = z.object({
  KITCHEN_TIME_SCALE: z.coerce.number().positive().default(1),
});

export default registerAs('kitchen', () => schema.parse(process.env));
