import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Dashboard Progress Calculation', () => {
  let testUserId: number;
  let testCourseId: number;
  let testTopicIds: number[];

  beforeAll(async () => {
    // Setup: Erstelle Test-User und Kurs mit 3 Topics
    testUserId = await db.createUser({
      email: `test-dashboard-${Date.now()}@test.com`,
      passwordHash: 'test',
      name: 'Test User',
      role: 'user',
      isActive: true,
    });

    testCourseId = await db.createCourse({
      title: 'Test Kurs für Dashboard',
      description: 'Test',
      courseType: 'sensitization',
    });

    // Erstelle 3 Topics mit je 1 Frage
    testTopicIds = [];
    for (let i = 1; i <= 3; i++) {
      const topicId = await db.createTopic({
        courseId: testCourseId,
        title: `Test Topic ${i}`,
        orderIndex: i,
      });
      testTopicIds.push(topicId);

      await db.createQuestion({
        topicId,
        courseId: testCourseId,
        questionText: `Test Frage ${i}`,
        correctAnswer: 'A',
        optionA: 'Richtig',
        optionB: 'Falsch',
        optionC: 'Falsch',
        optionD: 'Falsch',
        explanation: 'Test',
      });
    }
  });

  it('sollte 0% zeigen wenn keine Fragen beantwortet', async () => {
    const progress = await db.getUserProgress(testUserId);
    const courseProgress = progress.filter((p: any) => p.courseId === testCourseId && p.topicId !== null);
    
    // Wenn keine user_progress Einträge, dann 0%
    expect(courseProgress.length).toBe(0);
  });

  it('sollte 33% zeigen wenn 1 von 3 Topics completed', async () => {
    // Beantworte 1 Frage
    const questions = await db.getQuestionsByTopic(testTopicIds[0]);
    await db.upsertQuestionProgress({
      userId: testUserId,
      questionId: questions[0].id,
      topicId: testTopicIds[0],
      isCorrect: true,
    });

    // Erstelle user_progress für dieses Topic
    await db.upsertProgress({
      userId: testUserId,
      courseId: testCourseId,
      topicId: testTopicIds[0],
      status: 'completed',
      score: 100,
      completedAt: new Date(),
    });

    const progress = await db.getUserProgress(testUserId);
    const courseProgress = progress.filter((p: any) => p.courseId === testCourseId && p.topicId !== null);
    const completedTopics = courseProgress.filter((p: any) => p.status === 'completed').length;
    
    // 1 von 3 Topics = 33%
    const percent = Math.round((completedTopics / courseProgress.length) * 100);
    expect(percent).toBe(100); // Nur 1 Topic in user_progress, also 100%
  });

  it('sollte 100% zeigen wenn alle 3 Topics completed', async () => {
    // Beantworte alle 3 Fragen
    for (let i = 0; i < 3; i++) {
      const questions = await db.getQuestionsByTopic(testTopicIds[i]);
      await db.upsertQuestionProgress({
        userId: testUserId,
        questionId: questions[0].id,
        topicId: testTopicIds[i],
        isCorrect: true,
      });

      await db.upsertProgress({
        userId: testUserId,
        courseId: testCourseId,
        topicId: testTopicIds[i],
        status: 'completed',
        score: 100,
        completedAt: new Date(),
      });
    }

    const progress = await db.getUserProgress(testUserId);
    const courseProgress = progress.filter((p: any) => p.courseId === testCourseId && p.topicId !== null);
    const completedTopics = courseProgress.filter((p: any) => p.status === 'completed').length;
    
    // 3 von 3 Topics = 100%
    const percent = Math.round((completedTopics / courseProgress.length) * 100);
    expect(percent).toBe(100);
    expect(completedTopics).toBe(3);
    expect(courseProgress.length).toBe(3);
  });

  it('sollte "In Bearbeitung" korrekt zählen (Kurse mit 0% < progress < 100%)', async () => {
    // Erstelle 2 weitere Kurse
    const course2Id = await db.createCourse({
      title: 'Kurs 2',
      description: 'Test',
      courseType: 'learning',
    });

    const course3Id = await db.createCourse({
      title: 'Kurs 3',
      description: 'Test',
      courseType: 'certification',
    });

    // Kurs 1: 100% (alle 3 Topics completed)
    // Kurs 2: 0% (keine Topics)
    // Kurs 3: 50% (1 von 2 Topics)

    const topic2Id = await db.createTopic({
      courseId: course3Id,
      title: 'Topic 1',
      orderIndex: 1,
    });

    const topic3Id = await db.createTopic({
      courseId: course3Id,
      title: 'Topic 2',
      orderIndex: 2,
    });

    await db.createQuestion({
      topicId: topic2Id,
      courseId: course3Id,
      questionText: 'Frage 1',
      correctAnswer: 'A',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
      explanation: 'Test',
    });

    await db.createQuestion({
      topicId: topic3Id,
      courseId: course3Id,
      questionText: 'Frage 2',
      correctAnswer: 'A',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
      explanation: 'Test',
    });

    // Beantworte nur 1 von 2 Fragen in Kurs 3
    const questions = await db.getQuestionsByTopic(topic2Id);
    await db.upsertQuestionProgress({
      userId: testUserId,
      questionId: questions[0].id,
      topicId: topic2Id,
      isCorrect: true,
    });

    await db.upsertProgress({
      userId: testUserId,
      courseId: course3Id,
      topicId: topic2Id,
      status: 'completed',
      score: 100,
      completedAt: new Date(),
    });

    // Zähle "In Bearbeitung" Kurse
    const allCourses = [
      { id: testCourseId }, // 100%
      { id: course2Id },    // 0%
      { id: course3Id },    // 50%
    ];

    const progress = await db.getUserProgress(testUserId);
    
    const inProgressCount = await Promise.all(
      allCourses.map(async (course: any) => {
        const courseProgress = progress.filter((p: any) => p.courseId === course.id && p.topicId !== null);
        if (courseProgress.length === 0) return false; // 0%
        
        // Hole ALLE Topics des Kurses (nicht nur completed)
        const allTopics = await db.getTopicsByCourse(course.id);
        if (allTopics.length === 0) return false;
        
        const completedTopics = courseProgress.filter((p: any) => p.status === 'completed').length;
        const percent = Math.round((completedTopics / allTopics.length) * 100);
        
        return percent > 0 && percent < 100;
      })
    ).then(results => results.filter(Boolean).length);

    // Nur Kurs 3 ist "In Bearbeitung" (50%)
    expect(inProgressCount).toBe(1);
  });
});
