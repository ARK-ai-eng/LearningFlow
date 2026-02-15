import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Kurs-Wiederholungs-Feature', () => {
  let testUserId: number;
  let testCourseId: number;
  let testTopicId: number;
  let testQuestionIds: number[];

  beforeAll(async () => {
    // Setup: Erstelle Test-User, Kurs, Topic und Fragen
    testUserId = await db.createUser({
      email: `test-reset-${Date.now()}@test.com`,
      passwordHash: 'test',
      name: 'Test User',
      role: 'user',
      isActive: true,
    });

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
        optionA: 'Richtig',
        optionB: 'Falsch',
        optionC: 'Falsch',
        optionD: 'Falsch',
        explanation: 'Test',
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
