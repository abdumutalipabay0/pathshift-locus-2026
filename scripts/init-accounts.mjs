import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = neon(process.env.DATABASE_URL);
await sql.query(readFileSync(new URL('./account-schema.sql', import.meta.url), 'utf8'));
console.log('Account profile table is ready.');
