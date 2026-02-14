import { db } from "./server/db";
import { questionProgress, questions, users } from "./drizzle/schema";
import { eq, and } from "drizzle-orm";

async function checkProgress() {
  // Find user
  const user = await db.select().from(users).where(eq(users.email, "testyou@me.com")).limit(1);
  if (!user || user.length === 0) {
    console.log("User not found");
    return;
  }
  
  console.log("User:", user[0].id, user[0].email);
  
  // Get all progress for Course 2
  const progress = await db
    .select({
      id: questionProgress.id,
      questionId: questionProgress.questionId,
      topicId: questionProgress.topicId,
      firstAttemptStatus: questionProgress.firstAttemptStatus,
      lastAttemptCorrect: questionProgress.lastAttemptCorrect,
      attemptCount: questionProgress.attemptCount,
    })
    .from(questionProgress)
    .innerJoin(questions, eq(questionProgress.questionId, questions.id))
    .where(and(
      eq(questionProgress.userId, user[0].id),
      eq(questions.courseId, 2)
    ));
  
  console.log("\nProgress for Course 2:");
  console.table(progress);
  
  // Statistics
  const stats = progress.reduce((acc, p) => {
    acc[p.firstAttemptStatus] = (acc[p.firstAttemptStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("\nStatistics:");
  console.log(stats);
  
  process.exit(0);
}

checkProgress().catch(console.error);
