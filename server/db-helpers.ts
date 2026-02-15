/**
 * Helper functions for data integrity checks
 */

import { users } from '../drizzle/schema';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { ENV } from './_core/env';

// Kopie von getDb() aus db.ts
let _db: any = null;
let _pool: any = null;

async function getDb() {
  if (_db) return _db;
  if (!ENV.databaseUrl) {
    console.error('[DB] databaseUrl not set');
    return null;
  }
  try {
    _pool = mysql.createPool(ENV.databaseUrl);
    _db = drizzle(_pool);
    return _db;
  } catch (error) {
    console.error('[DB] Failed to connect:', error);
    return null;
  }
}

/**
 * Holt ALLE User (für Integrity-Checks)
 */
export async function getAllUsers() {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(users);
}
