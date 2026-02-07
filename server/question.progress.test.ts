import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Question Progress API', () => {
  let testUserId: number;
  let testQuestionId: number;
  let testTopicId: number;
  let testCourseId: number;

  beforeAll(async () => {
    // Setup: Erstelle Test-User, Kurs, Thema, Frage
    testUserId = await db.createUser({
      email: `test-progress-${Date.now()}@test.com`,
      passwordHash: 'test',
      name: 'Test User',
      role: 'user',
      isActive: true,
    });

    const companyId = await db.createCompany({
      name: 'Test Company Progress',
      status: 'active',
    });

    testCourseId = await db.createCourse({
      title: 'Test Course Progress',
      description: 'Test',
      courseType: 'sensitization',
      isActive: true,
      isMandatory: false,
    });

    testTopicId = await db.createTopic({
      courseId: testCourseId,
      title: 'Test Topic Progress',
      description: 'Test',
      orderIndex: 1,
    });

    testQuestionId = await db.createQuestion({
      topicId: testTopicId,
      courseId: testCourseId,
      questionText: 'Test Question?',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
      correctAnswer: 'A',
    });
  });

  describe('question.getProgress', () => {
    it('sollte leeres Array zurückgeben wenn noch kein Fortschritt', async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, email: 'test@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const progress = await caller.question.getProgress({ topicId: testTopicId });
      expect(Array.isArray(progress)).toBe(true);
      expect(progress.length).toBe(0);
    });

    it('sollte Fortschritt zurückgeben nach submitAnswer', async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, email: 'test@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      // Submit answer
      await caller.question.submitAnswer({
        questionId: testQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: true,
      });

      // Get progress
      const progress = await caller.question.getProgress({ topicId: testTopicId });
      expect(progress.length).toBeGreaterThan(0);
      expect(progress[0].questionId).toBe(testQuestionId);
      expect(progress[0].status).toBe('correct');
    });

    it('sollte attemptCount erhöhen bei mehrfacher Beantwortung', async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, email: 'test@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      // Submit answer zweimal
      await caller.question.submitAnswer({
        questionId: testQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: false,
      });

      await caller.question.submitAnswer({
        questionId: testQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: true,
      });

      // Get progress
      const progress = await caller.question.getProgress({ topicId: testTopicId });
      const questionProgress = progress.find(p => p.questionId === testQuestionId);
      
      expect(questionProgress).toBeDefined();
      expect(questionProgress!.attemptCount).toBeGreaterThanOrEqual(2);
      expect(questionProgress!.status).toBe('correct'); // Letzter Status
    });
  });

  describe('question.submitAnswer', () => {
    it('sollte Antwort als correct speichern', async () => {
      const newQuestionId = await db.createQuestion({
        topicId: testTopicId,
        courseId: 1,
        questionText: 'Test Question 2?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'B',
      });

      const caller = appRouter.createCaller({
        user: { id: testUserId, email: 'test@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.question.submitAnswer({
        questionId: newQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: true,
      });

      expect(result.success).toBe(true);

      // Verify
      const progress = await caller.question.getProgress({ topicId: testTopicId });
      const questionProgress = progress.find(p => p.questionId === newQuestionId);
      expect(questionProgress?.status).toBe('correct');
    });

    it('sollte Antwort als incorrect speichern', async () => {
      const newQuestionId = await db.createQuestion({
        topicId: testTopicId,
        courseId: 1,
        questionText: 'Test Question 3?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'C',
      });

      const caller = appRouter.createCaller({
        user: { id: testUserId, email: 'test@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.question.submitAnswer({
        questionId: newQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: false,
      });

      expect(result.success).toBe(true);

      // Verify
      const progress = await caller.question.getProgress({ topicId: testTopicId });
      const questionProgress = progress.find(p => p.questionId === newQuestionId);
      expect(questionProgress?.status).toBe('incorrect');
    });

    it('sollte Status aktualisieren bei erneuter Beantwortung', async () => {
      const newQuestionId = await db.createQuestion({
        topicId: testTopicId,
        courseId: 1,
        questionText: 'Test Question 4?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'D',
      });

      const caller = appRouter.createCaller({
        user: { id: testUserId, email: 'test@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      // Erst falsch
      await caller.question.submitAnswer({
        questionId: newQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: false,
      });

      // Dann richtig
      await caller.question.submitAnswer({
        questionId: newQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: true,
      });

      // Verify
      const progress = await caller.question.getProgress({ topicId: testTopicId });
      const questionProgress = progress.find(p => p.questionId === newQuestionId);
      expect(questionProgress?.status).toBe('correct');
      expect(questionProgress?.attemptCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('question.getIncorrectQuestions', () => {
    it('sollte nur falsch beantwortete Fragen zurückgeben', async () => {
      const correctQuestionId = await db.createQuestion({
        topicId: testTopicId,
        courseId: 1,
        questionText: 'Correct Question?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'A',
      });

      const incorrectQuestionId = await db.createQuestion({
        topicId: testTopicId,
        courseId: 1,
        questionText: 'Incorrect Question?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'B',
      });

      const caller = appRouter.createCaller({
        user: { id: testUserId, email: 'test@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      // Submit correct
      await caller.question.submitAnswer({
        questionId: correctQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: true,
      });

      // Submit incorrect
      await caller.question.submitAnswer({
        questionId: incorrectQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: false,
      });

      // Get incorrect questions
      const incorrectQuestions = await caller.question.getIncorrectQuestions({ topicId: testTopicId });
      
      expect(incorrectQuestions).toContain(incorrectQuestionId);
      expect(incorrectQuestions).not.toContain(correctQuestionId);
    });

    it('sollte leeres Array zurückgeben wenn alle Fragen richtig', async () => {
      const newUserId = await db.createUser({
        email: `test-all-correct-${Date.now()}@test.com`,
        passwordHash: 'test',
        name: 'Test User 2',
        role: 'user',
        isActive: true,
      });

      const newQuestionId = await db.createQuestion({
        topicId: testTopicId,
        courseId: 1,
        questionText: 'All Correct Question?',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'A',
      });

      const caller = appRouter.createCaller({
        user: { id: newUserId, email: 'test2@test.com', role: 'user' },
        req: {} as any,
        res: {} as any,
      });

      // Submit correct
      await caller.question.submitAnswer({
        questionId: newQuestionId,
        topicId: testTopicId,
        courseId: testCourseId,
        isCorrect: true,
      });

      // Get incorrect questions
      const incorrectQuestions = await caller.question.getIncorrectQuestions({ topicId: testTopicId });
      
      expect(incorrectQuestions.length).toBe(0);
    });
  });
});
