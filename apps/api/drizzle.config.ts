import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'sqljs',
  dbCredentials: {
    url: './data/auto.db',
  },
} satisfies Config;
