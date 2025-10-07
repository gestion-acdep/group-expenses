import { loadEnvFile } from 'process';
loadEnvFile('.env.local');

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: 'src/lib/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_TOKEN!,
  },
});
