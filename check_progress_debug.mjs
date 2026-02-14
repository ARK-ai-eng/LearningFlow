import { getDb } from './server/_core/db.ts';
import { questionProgress, questions, users } from './drizzle/schema.ts';
import { eq, and, like } from 'drizzle-orm';

const db = await getDb();

// Find user
const [user] = await db.select().from(users).where(eq(users.email, 'testyou@me.com'));
console.log('User ID:', user.id);

// Find question
const [question] = await db.select().from(questions).where(like(questions.questionText, '%Anhang%gefährlich%'));
console.log('Question ID:', question.id);
console.log('Question Text:', question.questionText);

// Find progress
const [progress] = await db
  .select()
  .from(questionProgress)
  .where(and(
    eq(questionProgress.userId, user.id),
    eq(questionProgress.questionId, question.id)
  ));

if (progress) {
  console.log('\n=== Progress Entry ===');
  console.log('firstAttemptStatus:', progress.firstAttemptStatus);
  console.log('lastAttemptCorrect:', progress.lastAttemptCorrect);
  console.log('updatedAt:', progress.updatedAt);
} else {
  console.log('\nNO PROGRESS ENTRY FOUND!');
}

process.exit(0);
