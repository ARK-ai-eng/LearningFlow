/**
 * PHASE 1: N+1 Query Elimination
 * 
 * Optimierte DB-Funktionen mit JOINs statt N+1 Queries
 * Multi-Tenancy: companyId + userId IMMER explizit filtern
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';

/**
 * Holt aktive Kurse mit Stats für einen User (1-2 Queries statt 34+)
 * 
 * Multi-Tenancy: userId wird explizit gefiltert
 * 
 * @param userId - User ID für Fortschritt-Berechnung
 * @returns Kurse mit Stats (total, answered, correct, percentage)
 */
export async function getActiveCoursesWithStats(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const start = process.hrtime.bigint();

  // SINGLE QUERY mit JOINs und Aggregation
  const result = await db.execute(sql`
    SELECT 
      c.id,
      c.title,
      c.description,
      c.courseType,
      c.isActive,
      COUNT(DISTINCT q.id) as total,
      COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus != 'unanswered' THEN qp.questionId END) as answered,
      COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus = 'correct' THEN qp.questionId END) as correct,
      ROUND(
        CASE 
          WHEN COUNT(DISTINCT q.id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus = 'correct' THEN qp.questionId END) * 100.0 / COUNT(DISTINCT q.id))
          ELSE 0 
        END
      ) as percentage
    FROM courses c
    LEFT JOIN topics t ON t.courseId = c.id
    LEFT JOIN questions q ON q.topicId = t.id
    LEFT JOIN question_progress qp ON qp.questionId = q.id AND qp.userId = ${userId}
    WHERE c.isActive = 1
    GROUP BY c.id, c.title, c.description, c.courseType, c.isActive
    ORDER BY c.id
  `);

  const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
  console.log('[DB]', { fn: 'getActiveCoursesWithStats', userId, ms: duration, queryCount: 1 });

  // Transformiere Ergebnis
  return (result as any[]).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    courseType: row.courseType,
    isActive: Boolean(row.isActive),
    stats: {
      total: Number(row.total),
      answered: Number(row.answered),
      correct: Number(row.correct),
      percentage: Number(row.percentage),
    },
  }));
}

/**
 * Holt Kurs-Stats mit Topic-Progress für einen User (1-2 Queries statt 26+)
 * 
 * Multi-Tenancy: userId + courseId werden explizit gefiltert
 * 
 * @param userId - User ID
 * @param courseId - Course ID
 * @returns Kurs-Stats mit Topic-Progress
 */
export async function getCourseStatsWithTopics(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return null;

  const start = process.hrtime.bigint();

  // Query 1: Kurs-Stats (gesamt)
  const courseStats = await db.execute(sql`
    SELECT 
      COUNT(DISTINCT q.id) as total,
      COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus != 'unanswered' THEN qp.questionId END) as answered,
      COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus = 'correct' THEN qp.questionId END) as correct,
      COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus = 'incorrect' THEN qp.questionId END) as incorrect,
      ROUND(
        CASE 
          WHEN COUNT(DISTINCT q.id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus = 'correct' THEN qp.questionId END) * 100.0 / COUNT(DISTINCT q.id))
          ELSE 0 
        END
      ) as percentage,
      MAX(qp.lastCompletedAt) as lastCompletedAt
    FROM courses c
    LEFT JOIN topics t ON t.courseId = c.id
    LEFT JOIN questions q ON q.topicId = t.id
    LEFT JOIN question_progress qp ON qp.questionId = q.id AND qp.userId = ${userId}
    WHERE c.id = ${courseId}
  `);

  // Query 2: Topic-Progress
  const topicProgress = await db.execute(sql`
    SELECT 
      t.id as topicId,
      t.title as topicTitle,
      COUNT(DISTINCT q.id) as total,
      COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus != 'unanswered' THEN qp.questionId END) as answered,
      COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus = 'correct' THEN qp.questionId END) as correct,
      ROUND(
        CASE 
          WHEN COUNT(DISTINCT q.id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN qp.firstAttemptStatus = 'correct' THEN qp.questionId END) * 100.0 / COUNT(DISTINCT q.id))
          ELSE 0 
        END
      ) as percentage
    FROM topics t
    LEFT JOIN questions q ON q.topicId = t.id
    LEFT JOIN question_progress qp ON qp.questionId = q.id AND qp.userId = ${userId}
    WHERE t.courseId = ${courseId}
    GROUP BY t.id, t.title
    ORDER BY t.id
  `);

  const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
  console.log('[DB]', { fn: 'getCourseStatsWithTopics', userId, courseId, ms: duration, queryCount: 2 });

  const stats = (courseStats as any[])[0];
  
  return {
    courseId,
    total: Number(stats.total),
    answered: Number(stats.answered),
    correct: Number(stats.correct),
    incorrect: Number(stats.incorrect),
    percentage: Number(stats.percentage),
    lastCompletedAt: stats.lastCompletedAt,
    topicProgress: (topicProgress as any[]).map((row: any) => ({
      topicId: row.topicId,
      topicTitle: row.topicTitle,
      total: Number(row.total),
      answered: Number(row.answered),
      correct: Number(row.correct),
      percentage: Number(row.percentage),
    })),
  };
}

/**
 * Holt User-Zertifikate mit Kurs-Namen (1 Query statt 6+)
 * 
 * Multi-Tenancy: userId wird explizit gefiltert
 * 
 * @param userId - User ID
 * @returns Zertifikate mit Kurs-Namen
 */
export async function getUserCertificatesWithCourse(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const start = process.hrtime.bigint();

  // SINGLE QUERY mit JOIN
  const result = await db.execute(sql`
    SELECT 
      cert.id,
      cert.userId,
      cert.courseId,
      cert.examAttemptId,
      cert.certificateNumber,
      cert.issuedAt,
      cert.expiresAt,
      cert.pdfUrl,
      c.title as courseName
    FROM certificates cert
    INNER JOIN courses c ON c.id = cert.courseId
    WHERE cert.userId = ${userId}
    ORDER BY cert.issuedAt DESC
  `);

  const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
  console.log('[DB]', { fn: 'getUserCertificatesWithCourse', userId, ms: duration, queryCount: 1 });

  return (result as any[]).map((row: any) => ({
    id: row.id,
    userId: row.userId,
    courseId: row.courseId,
    examAttemptId: row.examAttemptId,
    certificateNumber: row.certificateNumber,
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    pdfUrl: row.pdfUrl,
    courseName: row.courseName || 'Unbekannt',
  }));
}
