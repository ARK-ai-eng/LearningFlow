import * as db from '../db';
import { getAllUsers } from '../db-helpers';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * Inkonsistenz-Typen
 */
export type InconsistencyType =
  | 'incomplete_topic_marked_complete'  // Topic als completed markiert aber nicht alle Fragen beantwortet
  | 'missing_user_progress'             // Fragen beantwortet aber kein user_progress Eintrag
  | 'complete_topic_not_marked';        // Alle Fragen beantwortet aber Topic nicht als completed markiert

/**
 * Inkonsistenz-Objekt
 */
export interface Inconsistency {
  type: InconsistencyType;
  userId: number;
  userEmail: string;
  courseId: number;
  courseTitle: string;
  topicId: number;
  topicTitle: string;
  expected: 'completed' | 'in_progress' | 'missing';
  actual: 'completed' | 'in_progress' | 'missing';
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
}

/**
 * Check-Optionen
 */
export interface CheckOptions {
  userId?: number;      // Nur bestimmten User prüfen
  courseId?: number;    // Nur bestimmten Kurs prüfen
  verbose?: boolean;    // Detailliertes Logging
}

/**
 * Check-Ergebnis
 */
export interface CheckResult {
  totalUsers: number;
  totalCourses: number;
  totalTopics: number;
  totalChecks: number;
  inconsistencies: Inconsistency[];
  affectedUsers: number;
  duration: number; // in ms
}

/**
 * Prüft Datenintegrität für alle User und Kurse
 */
export async function checkDataIntegrity(options: CheckOptions = {}): Promise<CheckResult> {
  const startTime = Date.now();
  const inconsistencies: Inconsistency[] = [];

  // 1. Lade alle User (oder nur bestimmten User)
  const users = options.userId
    ? [await db.getUserById(options.userId)].filter(Boolean)
    : await getAllUsers();

  if (options.verbose) {
    console.log(`[Checker] Checking ${users.length} users...`);
  }

  // 2. Lade alle Kurse (oder nur bestimmten Kurs)
  const courses = options.courseId
    ? [await db.getCourseById(options.courseId)].filter(Boolean)
    : await db.getActiveCourses();

  if (options.verbose) {
    console.log(`[Checker] Checking ${courses.length} courses...`);
  }

  let totalChecks = 0;
  const affectedUserIds = new Set<number>();

  // 3. Für jeden User und jeden Kurs: Prüfe Topics
  for (const user of users) {
    if (!user) continue;

    for (const course of courses) {
      if (!course) continue;

      // Hole alle Topics des Kurses
      const topics = await db.getTopicsByCourse(course.id);

      for (const topic of topics) {
        totalChecks++;

        // Prüfe dieses Topic
        const issues = await checkTopicIntegrity(
          user.id,
          user.email,
          course.id,
          course.title,
          topic.id,
          topic.title
        );

        if (issues.length > 0) {
          inconsistencies.push(...issues);
          affectedUserIds.add(user.id);

          if (options.verbose) {
            console.log(`[Checker] Found ${issues.length} issues for user ${user.email}, course ${course.title}, topic ${topic.title}`);
          }
        }
      }
    }
  }

  const duration = Date.now() - startTime;

  return {
    totalUsers: users.length,
    totalCourses: courses.length,
    totalTopics: courses.reduce((sum: number, c: any) => sum + (c ? 1 : 0), 0) * (courses[0] ? (await db.getTopicsByCourse(courses[0].id)).length : 0),
    totalChecks,
    inconsistencies,
    affectedUsers: affectedUserIds.size,
    duration,
  };
}

/**
 * Prüft Integrität für ein einzelnes Topic
 */
async function checkTopicIntegrity(
  userId: number,
  userEmail: string,
  courseId: number,
  courseTitle: string,
  topicId: number,
  topicTitle: string
): Promise<Inconsistency[]> {
  const issues: Inconsistency[] = [];

  // 1. Hole alle Fragen des Topics
  const topicQuestions = await db.getQuestionsByTopic(topicId);
  const questionsTotal = topicQuestions.length;

  if (questionsTotal === 0) {
    // Keine Fragen → Skip
    return issues;
  }

  // 2. Hole question_progress für diesen User und Topic
  const questionProgress = await db.getQuestionProgressByTopic(userId, topicId);
  const questionsAnswered = questionProgress.length;
  const questionsCorrect = questionProgress.filter(
    (p: any) => p.firstAttemptStatus === 'correct'
  ).length;

  // 3. Hole user_progress für diesen User und Topic
  const userProgressList = await db.getUserProgress(userId);
  const userProgress = userProgressList.find(
    (p: any) => p.courseId === courseId && p.topicId === topicId
  );

  // 4. Prüfe Regel 1: Topic ist "completed" nur wenn ALLE Fragen beantwortet
  if (userProgress && userProgress.status === 'completed' && questionsAnswered < questionsTotal) {
    issues.push({
      type: 'incomplete_topic_marked_complete',
      userId,
      userEmail,
      courseId,
      courseTitle,
      topicId,
      topicTitle,
      expected: 'in_progress',
      actual: 'completed',
      questionsTotal,
      questionsAnswered,
      questionsCorrect,
    });
  }

  // 5. Prüfe Regel 2: Wenn Fragen beantwortet, muss user_progress existieren
  if (questionsAnswered > 0 && !userProgress) {
    issues.push({
      type: 'missing_user_progress',
      userId,
      userEmail,
      courseId,
      courseTitle,
      topicId,
      topicTitle,
      expected: 'in_progress',
      actual: 'missing',
      questionsTotal,
      questionsAnswered,
      questionsCorrect,
    });
  }

  // 6. Prüfe Regel 3: Wenn ALLE Fragen beantwortet, muss status='completed' sein
  if (
    questionsAnswered === questionsTotal &&
    userProgress &&
    userProgress.status !== 'completed'
  ) {
    issues.push({
      type: 'complete_topic_not_marked',
      userId,
      userEmail,
      courseId,
      courseTitle,
      topicId,
      topicTitle,
      expected: 'completed',
      actual: userProgress.status,
      questionsTotal,
      questionsAnswered,
      questionsCorrect,
    });
  }

  return issues;
}

/**
 * Gruppiert Inkonsistenzen nach User
 */
export function groupByUser(inconsistencies: Inconsistency[]): Map<number, Inconsistency[]> {
  const grouped = new Map<number, Inconsistency[]>();

  for (const issue of inconsistencies) {
    if (!grouped.has(issue.userId)) {
      grouped.set(issue.userId, []);
    }
    grouped.get(issue.userId)!.push(issue);
  }

  return grouped;
}

/**
 * Gruppiert Inkonsistenzen nach Typ
 */
export function groupByType(inconsistencies: Inconsistency[]): Map<InconsistencyType, Inconsistency[]> {
  const grouped = new Map<InconsistencyType, Inconsistency[]>();

  for (const issue of inconsistencies) {
    if (!grouped.has(issue.type)) {
      grouped.set(issue.type, []);
    }
    grouped.get(issue.type)!.push(issue);
  }

  return grouped;
}
