import { eq, and, lt, gt, isNull, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  users, InsertUser, User,
  companies, InsertCompany, Company,
  invitations, InsertInvitation, Invitation,
  courses, InsertCourse, Course,
  topics, InsertTopic, Topic,
  questions, InsertQuestion, Question,
  userProgress, InsertUserProgress,
  examAttempts, InsertExamAttempt,
  certificates, InsertCertificate
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER FUNCTIONS
// ============================================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      email: user.email || "",
    };
    const updateSet: Record<string, unknown> = {};

    if (user.name !== undefined) {
      values.name = user.name ?? null;
      updateSet.name = user.name ?? null;
    }
    if (user.email !== undefined) {
      values.email = user.email;
      updateSet.email = user.email;
    }
    if (user.firstName !== undefined) {
      values.firstName = user.firstName;
      updateSet.firstName = user.firstName;
    }
    if (user.lastName !== undefined) {
      values.lastName = user.lastName;
      updateSet.lastName = user.lastName;
    }
    if (user.loginMethod !== undefined) {
      values.loginMethod = user.loginMethod;
      updateSet.loginMethod = user.loginMethod;
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'sysadmin';
      updateSet.role = 'sysadmin';
    }
    if (user.companyId !== undefined) {
      values.companyId = user.companyId;
      updateSet.companyId = user.companyId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// HAUPT-FUNKTION: E-Mail ist der einzige Identifier
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

export async function getUsersByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.companyId, companyId));
}

export async function updateUserRole(userId: number, role: "sysadmin" | "companyadmin" | "user") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
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
  // Lösche alle zugehörigen User
  await db.delete(users).where(eq(users.companyId, id));
  // Lösche alle Einladungen
  await db.delete(invitations).where(eq(invitations.companyId, id));
  // Lösche die Firma
  await db.delete(companies).where(eq(companies.id, id));
}

// ============================================
// INVITATION FUNCTIONS
// ============================================
export async function createInvitation(invitation: InsertInvitation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invitations).values(invitation);
  return result[0].insertId;
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations)
    .where(and(eq(invitations.token, token), isNull(invitations.usedAt)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Prüft ob eine AKTIVE (nicht benutzt, nicht abgelaufen) Einladung für diese E-Mail existiert
export async function getActiveInvitationByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invitations)
    .where(and(
      eq(invitations.email, email.toLowerCase()),
      isNull(invitations.usedAt),
      gt(invitations.expiresAt, new Date()) // Nicht abgelaufen
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}


export async function markInvitationUsed(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set({ usedAt: new Date() }).where(eq(invitations.token, token));
}

export async function deleteExpiredInvitations() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(invitations)
    .where(and(lt(invitations.expiresAt, new Date()), isNull(invitations.usedAt)));
  return result[0].affectedRows;
}

export async function getPendingInvitationsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(invitations)
    .where(and(eq(invitations.companyId, companyId), isNull(invitations.usedAt)));
}

export async function deleteInvitation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(invitations).where(eq(invitations.id, id));
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
  return db.select().from(courses).orderBy(desc(courses.createdAt));
}

export async function getActiveCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courses).where(eq(courses.isActive, true));
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
  const result = await db.insert(questions).values(question);
  return result[0].insertId;
}

export async function getQuestionsByTopic(topicId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questions).where(eq(questions.topicId, topicId));
}

export async function getQuestionsByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questions).where(eq(questions.courseId, courseId));
}

export async function updateQuestion(id: number, data: Partial<InsertQuestion>) {
  const db = await getDb();
  if (!db) return;
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
export async function upsertProgress(progress: InsertUserProgress) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(userProgress)
    .where(and(
      eq(userProgress.userId, progress.userId),
      eq(userProgress.courseId, progress.courseId),
      progress.topicId ? eq(userProgress.topicId, progress.topicId) : isNull(userProgress.topicId)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userProgress).set(progress).where(eq(userProgress.id, existing[0].id));
  } else {
    await db.insert(userProgress).values(progress);
  }
}

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
