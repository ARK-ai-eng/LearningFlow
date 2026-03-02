/**
 * Tests für db-optimized.ts
 * Fokus: Korrekte Behandlung von db.execute() [rows, fields] Rückgabe
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getDb
vi.mock('./db', () => ({
  getDb: vi.fn(),
}));

import { getDb } from './db';
import { getCourseStatsWithTopics } from './db-optimized';

describe('getCourseStatsWithTopics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sollte korrekte Stats zurückgeben wenn db.execute() [rows, fields] zurückgibt', async () => {
    // db.execute() gibt [rows, fields] zurück (mysql2-Verhalten)
    const mockCourseStatsRows = [
      { total: '20', answered: '10', correct: '8', incorrect: '2', percentage: '40', lastCompletedAt: null }
    ];
    const mockTopicProgressRows = [
      { topicId: 1, topicTitle: 'Thema 1', total: '10', answered: '5', correct: '4', percentage: '40' },
      { topicId: 2, topicTitle: 'Thema 2', total: '10', answered: '5', correct: '4', percentage: '40' },
    ];

    const mockDb = {
      execute: vi.fn()
        .mockResolvedValueOnce([mockCourseStatsRows, []]) // [rows, fields] Format
        .mockResolvedValueOnce([mockTopicProgressRows, []]), // [rows, fields] Format
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await getCourseStatsWithTopics(1, 100);

    expect(result).not.toBeNull();
    expect(result!.total).toBe(20);
    expect(result!.answered).toBe(10);
    expect(result!.correct).toBe(8);
    expect(result!.incorrect).toBe(2);
    expect(result!.percentage).toBe(40);
    expect(result!.topicProgress).toHaveLength(2);
    expect(result!.topicProgress[0].topicId).toBe(1);
    expect(result!.topicProgress[0].correct).toBe(4);
  });

  it('sollte korrekte Stats zurückgeben wenn db.execute() rows direkt zurückgibt', async () => {
    // Fallback: rows direkt (ohne fields)
    const mockCourseStatsRows = [
      { total: '15', answered: '5', correct: '5', incorrect: '0', percentage: '33', lastCompletedAt: null }
    ];
    const mockTopicProgressRows = [
      { topicId: 3, topicTitle: 'Thema 3', total: '15', answered: '5', correct: '5', percentage: '33' },
    ];

    const mockDb = {
      execute: vi.fn()
        .mockResolvedValueOnce(mockCourseStatsRows) // direkt rows (kein [rows, fields])
        .mockResolvedValueOnce(mockTopicProgressRows),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await getCourseStatsWithTopics(1, 200);

    expect(result).not.toBeNull();
    expect(result!.total).toBe(15);
    expect(result!.correct).toBe(5);
    expect(result!.percentage).toBe(33);
    expect(result!.topicProgress).toHaveLength(1);
  });

  it('sollte null zurückgeben wenn keine DB-Verbindung', async () => {
    vi.mocked(getDb).mockResolvedValue(null as any);

    const result = await getCourseStatsWithTopics(1, 100);
    expect(result).toBeNull();
  });

  it('"Fragen warten auf dich" sollte korrekt berechnet werden', async () => {
    // Simuliert: 20 Fragen gesamt, 8 korrekt → 12 warten noch
    const mockCourseStatsRows = [
      { total: '20', answered: '8', correct: '8', incorrect: '0', percentage: '40', lastCompletedAt: null }
    ];
    const mockTopicProgressRows: any[] = [];

    const mockDb = {
      execute: vi.fn()
        .mockResolvedValueOnce([mockCourseStatsRows, []])
        .mockResolvedValueOnce([mockTopicProgressRows, []]),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    const result = await getCourseStatsWithTopics(1, 300);

    expect(result).not.toBeNull();
    // "Fragen warten auf dich" = total - correct
    const fragenWartenAufDich = result!.total - result!.correct;
    expect(fragenWartenAufDich).toBe(12); // 20 - 8 = 12
  });
});
