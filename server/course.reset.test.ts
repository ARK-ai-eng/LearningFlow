import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import { getDb } from './_core/database.js';

describe('Kurs-Wiederholungs-Feature', () => {
  let testUserId: number;
  let testCourseId: number;
  let testTopicId: number;
  let testQuestionIds: number[];

  beforeAll(async () => {
    // Setup: Erstelle Test-User, Kurs, Topic und Fragen
    const database = await getDb();
    if (!database) throw new Error('Database not available');

    // Erstelle Test-User
    const userResult = await database
      .insert(await import('./drizzle/schema').then(m => m.users))
      .values({
        email: `test-reset-${Date.now()}@test.com`,
        passwordHash: 'test',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      });
    testUserId = Number(userResult.insertId);

    // Erstelle Test-Kurs
    testCourseId = await db.createCourse({
      title: 'Test Kurs für Reset',
      description: 'Test',
      courseType: 'sensitization',
    });

    // Erstelle Test-Topic
    testTopicId = await db.createTopic({
      courseId: testCourseId,
      title: 'Test Topic',
      orderIndex: 1,
    });

    // Erstelle 3 Test-Fragen
    testQuestionIds = [];
    for (let i = 1; i <= 3; i++) {
      const questionId = await db.createQuestion({
        topicId: testTopicId,
        courseId: testCourseId,
        questionText: `Test Frage ${i}`,
        correctAnswer: 'A',
        answerA: 'Richtig',
        answerB: 'Falsch',
        answerC: 'Falsch',
        answerD: 'Falsch',
        explanation: 'Test',
        orderIndex: i,
      });
      testQuestionIds.push(questionId);
    }
  });

  it('sollte lastCompletedAt setzen wenn User 100% erreicht', async () => {
    // Beantworte alle 3 Fragen korrekt
    for (const questionId of testQuestionIds) {
      await db.upsertQuestionProgress({
        userId: testUserId,
        questionId,
        topicId: testTopicId,
        isCorrect: true,
      });
    }

    // Hole Progress
    const progress = await db.getQuestionProgressByCourse(testUserId, testCourseId);
    
    // Prüfe: Alle Progress-Einträge haben lastCompletedAt gesetzt
    expect(progress.length).toBe(3);
    for (const p of progress) {
      expect(p.lastCompletedAt).not.toBeNull();
      expect(p.firstAttemptStatus).toBe('correct');
    }
  });

  it('sollte Progress zurücksetzen aber lastCompletedAt behalten', async () => {
    // Hole lastCompletedAt vor Reset
    const progressBefore = await db.getQuestionProgressByCourse(testUserId, testCourseId);
    const lastCompletedBefore = progressBefore[0]?.lastCompletedAt;
    expect(lastCompletedBefore).not.toBeNull();

    // Reset
    await db.resetQuestionProgressByCourse(testUserId, testCourseId);

    // Hole Progress nach Reset
    const progressAfter = await db.getQuestionProgressByCourse(testUserId, testCourseId);
    
    // Prüfe: firstAttemptStatus zurückgesetzt, lastCompletedAt erhalten
    expect(progressAfter.length).toBe(3);
    for (const p of progressAfter) {
      expect(p.firstAttemptStatus).toBe('unanswered');
      expect(p.attemptCount).toBe(0);
      expect(p.lastCompletedAt).toEqual(lastCompletedBefore);
    }
  });

  it('sollte nach Reset wieder Fragen anzeigen', async () => {
    // Hole unbeantwortete Fragen
    const unanswered = await db.getUnansweredQuestionsByCourse(testUserId, testCourseId);
    
    // Prüfe: Alle 3 Fragen sind wieder verfügbar
    expect(unanswered.length).toBe(3);
  });
});
