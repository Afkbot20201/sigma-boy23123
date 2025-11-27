import pkg from 'pg';
import { ENV } from './env.js';

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
