import * as db from '../db';
import type { Inconsistency } from './checker';

/**
 * Fix-Ergebnis
 */
export interface FixResult {
  totalFixed: number;
  fixedByType: Map<string, number>;
  errors: Array<{ issue: Inconsistency; error: string }>;
}

/**
 * Korrigiert alle gefundenen Inkonsistenzen
 */
export async function fixInconsistencies(inconsistencies: Inconsistency[]): Promise<FixResult> {
  const fixedByType = new Map<string, number>();
  const errors: Array<{ issue: Inconsistency; error: string }> = [];
  let totalFixed = 0;

  for (const issue of inconsistencies) {
    try {
      await fixSingleInconsistency(issue);
      
      totalFixed++;
      const count = fixedByType.get(issue.type) || 0;
      fixedByType.set(issue.type, count + 1);
    } catch (error: any) {
      errors.push({
        issue,
        error: error.message || String(error),
      });
    }
  }

  return {
    totalFixed,
    fixedByType,
    errors,
  };
}

/**
 * Korrigiert eine einzelne Inkonsistenz
 */
async function fixSingleInconsistency(issue: Inconsistency): Promise<void> {
  switch (issue.type) {
    case 'incomplete_topic_marked_complete':
      await fixIncompleteTopicMarkedComplete(issue);
      break;

    case 'missing_user_progress':
      await fixMissingUserProgress(issue);
      break;

    case 'complete_topic_not_marked':
      await fixCompleteTopicNotMarked(issue);
      break;

    default:
      throw new Error(`Unknown inconsistency type: ${issue.type}`);
  }
}

/**
 * Fix 1: Setze incomplete Topics auf "in_progress"
 */
async function fixIncompleteTopicMarkedComplete(issue: Inconsistency): Promise<void> {
  // Berechne Score basierend auf beantworteten Fragen
  const questionProgress = await db.getQuestionProgressByTopic(issue.userId, issue.topicId);
  const correctCount = questionProgress.filter(
    (p: any) => p.firstAttemptStatus === 'correct'
  ).length;
  const score = issue.questionsAnswered > 0
    ? Math.round((correctCount / issue.questionsAnswered) * 100)
    : 0;

  // Update user_progress
  await db.upsertProgress({
    userId: issue.userId,
    courseId: issue.courseId,
    topicId: issue.topicId,
    status: 'in_progress',
    score,
    completedAt: null,
  });
}

/**
 * Fix 2: Erstelle fehlende user_progress Einträge
 */
async function fixMissingUserProgress(issue: Inconsistency): Promise<void> {
  // Berechne Score
  const questionProgress = await db.getQuestionProgressByTopic(issue.userId, issue.topicId);
  const correctCount = questionProgress.filter(
    (p: any) => p.firstAttemptStatus === 'correct'
  ).length;
  const score = issue.questionsAnswered > 0
    ? Math.round((correctCount / issue.questionsAnswered) * 100)
    : 0;

  // Erstelle user_progress
  await db.upsertProgress({
    userId: issue.userId,
    courseId: issue.courseId,
    topicId: issue.topicId,
    status: 'in_progress',
    score,
    completedAt: null,
  });
}

/**
 * Fix 3: Setze complete Topics auf "completed"
 */
async function fixCompleteTopicNotMarked(issue: Inconsistency): Promise<void> {
  // Berechne Score
  const questionProgress = await db.getQuestionProgressByTopic(issue.userId, issue.topicId);
  const correctCount = questionProgress.filter(
    (p: any) => p.firstAttemptStatus === 'correct'
  ).length;
  const score = issue.questionsTotal > 0
    ? Math.round((correctCount / issue.questionsTotal) * 100)
    : 0;

  // Update user_progress
  await db.upsertProgress({
    userId: issue.userId,
    courseId: issue.courseId,
    topicId: issue.topicId,
    status: 'completed',
    score,
    completedAt: new Date(),
  });
}
