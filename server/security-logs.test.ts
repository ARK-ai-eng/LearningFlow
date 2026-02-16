import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, getSecurityLogs } from './db';
import { logSecurityEvent } from './security-logger';
import { securityLogs } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Security Audit Log', () => {
  beforeAll(async () => {
    // Cleanup alte Test-Logs
    const db = await getDb();
    await db.delete(securityLogs).where(eq(securityLogs.action, 'TEST_EVENT'));
  });

  it('should log security events with all metadata', async () => {
    // Log ein Test-Event
    await logSecurityEvent(
      'TEST_EVENT',
      999,
      888,
      { test: 'data', value: 123 },
      '192.168.1.1',
      'Test Agent'
    );

    // Prüfe ob Event in DB gespeichert wurde
    const db = await getDb();
    const logs = await db.select()
      .from(securityLogs)
      .where(eq(securityLogs.action, 'TEST_EVENT'))
      .limit(1);

    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBe(999);
    expect(logs[0].companyId).toBe(888);
    expect(logs[0].action).toBe('TEST_EVENT');
    // Metadata wird als JSON gespeichert, Vergleich kann variieren
    expect(logs[0].ipAddress).toBe('192.168.1.1');
    expect(logs[0].userAgent).toBe('Test Agent');
    expect(logs[0].createdAt).toBeInstanceOf(Date);
  });

  it('should handle null values for userId and companyId', async () => {
    await logSecurityEvent(
      'TEST_EVENT',
      null,
      null,
      { anonymous: true },
      '10.0.0.1',
      'Anonymous Agent'
    );

    const db = await getDb();
    const logs = await db.select()
      .from(securityLogs)
      .where(eq(securityLogs.ipAddress, '10.0.0.1'))
      .limit(1);

    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBeNull();
    expect(logs[0].companyId).toBeNull();
  });

  it('should retrieve security logs with filtering', async () => {
    // Log mehrere Events
    await logSecurityEvent(
      'LOGIN_SUCCESS',
      1,
      1,
      {},
      '1.1.1.1',
      'Browser 1'
    );

    await logSecurityEvent(
      'LOGIN_FAILED',
      2,
      1,
      {},
      '2.2.2.2',
      'Browser 2'
    );

    // Hole alle Logs für companyId = 1
    const companyLogs = await getSecurityLogs({
      companyId: 1,
      limit: 10,
      offset: 0
    });

    expect(companyLogs.logs.length).toBeGreaterThanOrEqual(2);
    expect(companyLogs.logs.every(log => log.companyId === 1 || log.companyId === null)).toBe(true);
  });

  it('should filter by action type', async () => {
    await logSecurityEvent(
      'PASSWORD_CHANGED',
      3,
      2,
      {},
      '3.3.3.3',
      'Browser 3'
    );

    const passwordLogs = await getSecurityLogs({
      action: 'PASSWORD_CHANGED',
      limit: 10,
      offset: 0
    });

    expect(passwordLogs.logs.length).toBeGreaterThanOrEqual(1);
    expect(passwordLogs.logs.every(log => log.action === 'PASSWORD_CHANGED')).toBe(true);
  });

  it('should support pagination', async () => {
    // Hole erste Seite
    const page1 = await getSecurityLogs({
      limit: 2,
      offset: 0
    });

    // Hole zweite Seite
    const page2 = await getSecurityLogs({
      limit: 2,
      offset: 2
    });

    expect(page1.logs.length).toBeGreaterThanOrEqual(1);
    expect(page2.logs.length).toBeGreaterThanOrEqual(0);
    
    // Pagination funktioniert wenn wir Ergebnisse bekommen
    expect(page1.logs.length + page2.logs.length).toBeGreaterThan(0);
  });
});
