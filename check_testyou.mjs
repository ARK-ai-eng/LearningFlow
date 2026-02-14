import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// Find user
const users = await db.select().from(schema.users).where(eq(schema.users.email, 'testyou@me.com'));
const user = users[0];

console.log('=== USER ===');
console.log(`ID: ${user.id}, Email: ${user.email}`);

// Get question progress for Course 2
const progress = await db
  .select()
  .from(schema.questionProgress)
  .innerJoin(schema.questions, eq(schema.questionProgress.questionId, schema.questions.id))
  .where(and(
    eq(schema.questionProgress.userId, user.id),
    eq(schema.questions.courseId, 2)
  ));

console.log('\n=== COURSE 2 PROGRESS ===');
console.log(`Total entries: ${progress.length}`);

if (progress.length > 0) {
  console.log('\nEntries:');
  progress.forEach(p => {
    console.log(`Q${p.question_progress.questionId}: firstAttempt=${p.question_progress.firstAttemptStatus}, attempts=${p.question_progress.attemptCount}`);
  });
} else {
  console.log('NO PROGRESS FOUND!');
}

await connection.end();
