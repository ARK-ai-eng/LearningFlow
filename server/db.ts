import { eq, and, desc, gt, isNull, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  users, InsertUser, User,
  companies, InsertCompany, Company,
  invitations, InsertInvitation, Invitation,
  courses, InsertCourse, Course,
  topics, InsertTopic, Topic,
  questions, InsertQuestion, Question,
  userProgress, InsertUserProgress,
  questionProgress, InsertQuestionProgress, QuestionProgress,
  examAttempts, InsertExamAttempt,
  certificates, InsertCertificate,
  examCompletions, InsertExamCompletion
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;
let _pool: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Erstelle einen mysql2/promise Pool
      if (!_pool) {
        _pool = mysql.createPool(process.env.DATABASE_URL);
      }
      // Übergebe den Pool an Drizzle
      _db = drizzle(_pool as any);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

// ============================================
// USER FUNCTIONS
// ============================================

// User erstellen (bei Einladungsannahme)
export async function createUser(user: InsertUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values({
    ...user,
    email: user.email.toLowerCase(),
  });
  return result[0].insertId;
}

// User per E-Mail finden (HAUPT-FUNKTION)
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function updateUserPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function updateUserLastSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

export async function getUsersByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.companyId, companyId));
}

export async function updateUserRole(id: number, role: 'sysadmin' | 'companyadmin' | 'user') {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// ============================================
// COMPANY FUNCTIONS
// ============================================
export async function createCompany(company: InsertCompany): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(company);
  return result[0].insertId;
}

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).orderBy(desc(companies.createdAt));
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCompany(id: number, data: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) return;
  await db.update(companies).set(data).where(eq(companies.id, id));
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) return;
  // Lösche zugehörige User und Einladungen
  await db.delete(users).where(eq(users.companyId, id));
  await db.delete(invitations).where(eq(invitations.companyId, id));
  await db.delete(companies).where(eq(companies.id, id));
}

// ============================================
// INVITATION FUNCTIONS
// ============================================
export async function createInvitation(invitation: InsertInvitation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invitations).values({
    ...invitation,
    email: invitation.email.toLowerCase(),
  });
  return result[0].insertId;
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Prüft ob eine aktive (nicht abgelaufene, nicht benutzte) Einladung für diese E-Mail existiert
export async function getActiveInvitationByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations)
    .where(and(
      eq(invitations.email, email.toLowerCase()),
      isNull(invitations.usedAt),
      gt(invitations.expiresAt, sql`NOW()`)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markInvitationUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set({ usedAt: new Date() }).where(eq(invitations.id, id));
}

export async function deleteInvitation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(invitations).where(eq(invitations.id, id));
}

export async function getPendingInvitationsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations)
    .where(and(
      eq(invitations.companyId, companyId),
      isNull(invitations.usedAt),
      gt(invitations.expiresAt, sql`NOW()`)
    ))
    .orderBy(desc(invitations.createdAt));
}

export async function getAllPendingInvitations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations)
    .where(and(
      isNull(invitations.usedAt),
      gt(invitations.expiresAt, sql`NOW()`)
    ))
    .orderBy(desc(invitations.createdAt));
}

export async function getExpiredInvitations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations)
    .where(and(
      isNull(invitations.usedAt),
      gt(sql`NOW()`, invitations.expiresAt)
    ))
    .orderBy(desc(invitations.createdAt));
}

export async function deleteExpiredInvitations() {
  const db = await getDb();
  if (!db) return;
  await db.delete(invitations).where(and(
    isNull(invitations.usedAt),
    gt(sql`NOW()`, invitations.expiresAt)
  ));
}

// ============================================
// COURSE FUNCTIONS
// ============================================
export async function createCourse(course: InsertCourse): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(courses).values(course);
  return result[0].insertId;
}

export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).orderBy(courses.title);
}

export async function getActiveCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).where(eq(courses.isActive, true)).orderBy(courses.title);
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) return;
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) return;
  // Lösche zugehörige Daten
  await db.delete(questions).where(eq(questions.courseId, id));
  await db.delete(topics).where(eq(topics.courseId, id));
  await db.delete(userProgress).where(eq(userProgress.courseId, id));
  await db.delete(courses).where(eq(courses.id, id));
}

// ============================================
// TOPIC FUNCTIONS
// ============================================
export async function createTopic(topic: InsertTopic): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(topics).values(topic);
  return result[0].insertId;
}

export async function getTopicsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(topics).where(eq(topics.courseId, courseId)).orderBy(topics.orderIndex);
}

export async function updateTopic(id: number, data: Partial<InsertTopic>) {
  const db = await getDb();
  if (!db) return;
  await db.update(topics).set(data).where(eq(topics.id, id));
}

export async function deleteTopic(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(questions).where(eq(questions.topicId, id));
  await db.delete(topics).where(eq(topics.id, id));
}

// ============================================
// QUESTION FUNCTIONS
// ============================================
export async function createQuestion(question: InsertQuestion): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Auto-sync courseId from topic (prevents courseId mismatch bug)
  if (question.topicId) {
    const topic = await db.select().from(topics).where(eq(topics.id, question.topicId)).limit(1);
    if (topic[0]) {
      question.courseId = topic[0].courseId;
    }
  }
  
  const result = await db.insert(questions).values(question);
  return result[0].insertId;
}

export async function getQuestionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  return result[0] || null;
}

export async function getQuestionsByTopic(
  topicId: number,
  options?: { isExamQuestion?: boolean }
) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(questions).where(eq(questions.topicId, topicId));
  
  // Optional: Nur Lern- oder Prüfungsfragen
  if (options?.isExamQuestion !== undefined) {
    query = query.where(eq(questions.isExamQuestion, options.isExamQuestion));
  }
  
  return query;
}

export async function getQuestionsByCourse(
  courseId: number,
  options?: { isExamQuestion?: boolean }
) {
  const db = await getDb();
  if (!db) return [];
  
  // Build WHERE conditions array
  const conditions = [eq(questions.courseId, courseId)];
  
  // Optional: Nur Lern- oder Prüfungsfragen
  if (options?.isExamQuestion !== undefined) {
    conditions.push(eq(questions.isExamQuestion, options.isExamQuestion));
  }
  
  // Combine all conditions with AND
  return db.select().from(questions).where(and(...conditions));
}

export async function updateQuestion(id: number, data: Partial<InsertQuestion>) {
  const db = await getDb();
  if (!db) return;
  
  // Auto-sync courseId from topic if topicId changed (prevents courseId mismatch bug)
  if (data.topicId) {
    const topic = await db.select().from(topics).where(eq(topics.id, data.topicId)).limit(1);
    if (topic[0]) {
      data.courseId = topic[0].courseId;
    }
  }
  
  await db.update(questions).set(data).where(eq(questions.id, id));
}

export async function deleteQuestion(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(questions).where(eq(questions.id, id));
}

// ============================================
// PROGRESS FUNCTIONS
// ============================================
export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userProgress).where(eq(userProgress.userId, userId));
}

export async function getUserCourseProgress(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)));
}

export async function upsertProgress(progress: InsertUserProgress) {
  const db = await getDb();
  if (!db) return;
  
  // Check if exists
  const existing = await db.select().from(userProgress)
    .where(and(
      eq(userProgress.userId, progress.userId),
      eq(userProgress.courseId, progress.courseId),
      progress.topicId ? eq(userProgress.topicId, progress.topicId) : isNull(userProgress.topicId)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userProgress)
      .set(progress)
      .where(eq(userProgress.id, existing[0].id));
  } else {
    await db.insert(userProgress).values(progress);
  }
}

// ============================================
// EXAM FUNCTIONS
// ============================================
export async function createExamAttempt(attempt: InsertExamAttempt): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(examAttempts).values(attempt);
  return result[0].insertId;
}

export async function getExamAttempt(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(examAttempts).where(eq(examAttempts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateExamAttempt(id: number, data: Partial<InsertExamAttempt>) {
  const db = await getDb();
  if (!db) return;
  await db.update(examAttempts).set(data).where(eq(examAttempts.id, id));
}

export async function getUserExamAttempts(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examAttempts)
    .where(and(eq(examAttempts.userId, userId), eq(examAttempts.courseId, courseId)))
    .orderBy(desc(examAttempts.startedAt));
}

// ============================================
// CERTIFICATE FUNCTIONS
// ============================================
export async function createCertificate(cert: InsertCertificate): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(certificates).values(cert);
  return result[0].insertId;
}

export async function getUserCertificates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(certificates).where(eq(certificates.userId, userId));
}

export async function getCertificateByNumber(certNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificates)
    .where(eq(certificates.certificateNumber, certNumber))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCertificateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificates)
    .where(eq(certificates.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCertificatePdfUrl(id: number, pdfUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(certificates).set({ pdfUrl }).where(eq(certificates.id, id));
}


// ============================================
// QUESTION PROGRESS FUNCTIONS
// ============================================

// Holt Fortschritt für alle Fragen eines Themas
export async function getQuestionProgressByTopic(userId: number, topicId: number): Promise<QuestionProgress[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      eq(questionProgress.topicId, topicId)
    ));
}

// Holt Fortschritt für alle Fragen eines Kurses
export async function getQuestionProgressByCourse(userId: number, courseId: number): Promise<QuestionProgress[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Hole alle Fragen des Kurses
  const courseQuestions = await getQuestionsByCourse(courseId);
  const questionIds = courseQuestions.map((q: any) => q.id);
  
  if (questionIds.length === 0) {
    return [];
  }
  
  // Hole Fortschritt für diese Fragen
  return await db
    .select()
    .from(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      inArray(questionProgress.questionId, questionIds)
    ));
}

// Setzt Fortschritt für einen Kurs zurück (löscht alle question_progress Einträge)
export async function resetQuestionProgressByCourse(userId: number, courseId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Hole alle Fragen des Kurses
  const courseQuestions = await getQuestionsByCourse(courseId);
  const questionIds = courseQuestions.map((q: any) => q.id);
  
  if (questionIds.length === 0) {
    return;
  }
  
  // Lösche alle question_progress Einträge für diese Fragen
  await db
    .delete(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      inArray(questionProgress.questionId, questionIds)
    ));
}

// Speichert oder aktualisiert Fortschritt für eine Frage
// WICHTIG: firstAttemptStatus wird NIEMALS überschrieben (ADR-013)
export async function upsertQuestionProgress(data: {
  userId: number;
  questionId: number;
  topicId: number;
  isCorrect: boolean; // Changed from 'status' to 'isCorrect' for clarity
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Prüfe ob Eintrag existiert
  const existing = await db
    .select()
    .from(questionProgress)
    .where(and(
      eq(questionProgress.userId, data.userId),
      eq(questionProgress.questionId, data.questionId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update: Erhöhe attemptCount, update lastAttemptCorrect
    // firstAttemptStatus: Wird auf 'correct' gesetzt wenn Wiederholung korrekt, sonst bleibt es
    await db
      .update(questionProgress)
      .set({
        // DEPRECATED: status kept for backward compatibility, but not used
        status: data.isCorrect ? 'correct' : 'incorrect',
        
        // Update firstAttemptStatus: Score steigt NUR wenn Antwort korrekt
        firstAttemptStatus: data.isCorrect ? 'correct' : existing[0].firstAttemptStatus,
        
        // Update last attempt result (for UI feedback)
        lastAttemptCorrect: data.isCorrect,
        
        attemptCount: sql`${questionProgress.attemptCount} + 1`,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(questionProgress.userId, data.userId),
        eq(questionProgress.questionId, data.questionId)
      ));
  } else {
    // Insert: Erste Antwort - setze firstAttemptStatus
    const status = data.isCorrect ? 'correct' : 'incorrect';
    await db.insert(questionProgress).values({
      userId: data.userId,
      questionId: data.questionId,
      topicId: data.topicId,
      
      // Set both status (deprecated) and firstAttemptStatus (new)
      status: status,
      firstAttemptStatus: status,
      lastAttemptCorrect: data.isCorrect,
      
      attemptCount: 1,
      lastAttemptAt: new Date(),
    });
  }
}

// Holt nur falsch beantwortete Fragen eines Themas (basierend auf ERSTER Antwort)
// WICHTIG: Verwendet firstAttemptStatus, nicht status! (ADR-013)
export async function getIncorrectQuestionsByTopic(userId: number, topicId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select({ questionId: questionProgress.questionId })
    .from(questionProgress)
    .where(and(
      eq(questionProgress.userId, userId),
      eq(questionProgress.topicId, topicId),
      // Changed from 'status' to 'firstAttemptStatus' (ADR-013)
      eq(questionProgress.firstAttemptStatus, 'incorrect')
    ));
  
  return results.map((r: any) => r.questionId);
}

// ============================================
// EXAM COMPLETIONS
// ============================================

export async function recordExamCompletion(data: {
  userId: number;
  courseId: number;
  score: number;
  passed: boolean;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(examCompletions).values({
    userId: data.userId,
    courseId: data.courseId,
    score: data.score,
    passed: data.passed,
    completedAt: new Date(),
  });

  return result.insertId;
}

export async function getLatestExamCompletion(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db
    .select()
    .from(examCompletions)
    .where(and(
      eq(examCompletions.userId, userId),
      eq(examCompletions.courseId, courseId)
    ))
    .orderBy(desc(examCompletions.completedAt))
    .limit(1);

  return result;
}


// ============================================
// RESUME FUNCTIONALITY
// ============================================

// Get random unanswered question for a course
// Returns question with topicId for Course 1 navigation
export async function getRandomUnansweredQuestion(userId: number, courseId: number): Promise<(Question & { topicId: number | null }) | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all questions for this course
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.courseId, courseId));

  if (allQuestions.length === 0) return null;

  // Get answered question IDs
  const answeredProgress = await db
    .select({ questionId: questionProgress.questionId })
    .from(questionProgress)
    .where(eq(questionProgress.userId, userId));

  const answeredIds = new Set(answeredProgress.map((p: any) => p.questionId));

  // Filter unanswered questions
  const unansweredQuestions = allQuestions.filter((q: any) => !answeredIds.has(q.id));

  if (unansweredQuestions.length === 0) return null;

  // Return first unanswered question (sorted by ID for consistent order)
  const sortedUnanswered = unansweredQuestions.sort((a: any, b: any) => a.id - b.id);
  return sortedUnanswered[0];
}
