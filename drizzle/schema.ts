import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, uniqueIndex, index } from "drizzle-orm/mysql-core";

// ============================================
// USERS - Alle Benutzer mit Rollen
// E-Mail ist der einzige eindeutige Identifier im System
// ============================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(), // EINZIGER Identifier
  passwordHash: varchar("passwordHash", { length: 255 }), // bcrypt hash, null für SysAdmin (OAuth)
  name: text("name"),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  personnelNumber: varchar("personnelNumber", { length: 50 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["sysadmin", "companyadmin", "user"]).default("user").notNull(),
  companyId: int("companyId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// COMPANIES - Firmenverwaltung
// ============================================
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  maxUsers: int("maxUsers").default(100),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ============================================
// INVITATIONS - Einladungen mit 24h Token
// E-Mail muss systemweit eindeutig sein (keine Duplikate)
// ============================================
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(), // Nicht unique - kann nach Ablauf neu eingeladen werden
  type: mysqlEnum("type", ["companyadmin", "user"]).notNull(),
  companyId: int("companyId"),
  companyName: varchar("companyName", { length: 255 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  personnelNumber: varchar("personnelNumber", { length: 50 }),
  invitedBy: int("invitedBy").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

// ============================================
// COURSES - Kurse mit 3 Typen
// ============================================
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseType: mysqlEnum("courseType", ["learning", "sensitization", "certification"]).default("learning").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isMandatory: boolean("isMandatory").default(false).notNull(),
  passingScore: int("passingScore").default(80),
  timeLimit: int("timeLimit").default(15), // Minuten für Jahresprüfung
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// ============================================
// TOPICS - Themen innerhalb von Kursen
// ============================================
export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

// ============================================
// QUESTIONS - Quiz-Fragen (A/B/C/D)
// ============================================
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  topicId: int("topicId").notNull(),
  courseId: int("courseId").notNull(),
  questionText: text("questionText").notNull(),
  optionA: varchar("optionA", { length: 500 }).notNull(),
  optionB: varchar("optionB", { length: 500 }).notNull(),
  optionC: varchar("optionC", { length: 500 }).notNull(),
  optionD: varchar("optionD", { length: 500 }).notNull(),
  correctAnswer: mysqlEnum("correctAnswer", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

// ============================================
// USER_PROGRESS - Lernfortschritt
// ============================================
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  topicId: int("topicId"),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  score: int("score"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

// ============================================
// QUESTION_PROGRESS - Granulares Fragen-Tracking
// ============================================
export const questionProgress = mysqlTable("question_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  topicId: int("topicId").notNull(),
  status: mysqlEnum("status", ["unanswered", "correct", "incorrect"]).default("unanswered").notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueUserQuestion: uniqueIndex("unique_user_question").on(table.userId, table.questionId),
  idxUserTopicStatus: index("idx_user_topic_status").on(table.userId, table.topicId, table.status),
}));

export type QuestionProgress = typeof questionProgress.$inferSelect;
export type InsertQuestionProgress = typeof questionProgress.$inferInsert;

// ============================================
// EXAM_ATTEMPTS - Jahresprüfungs-Versuche
// ============================================
export const examAttempts = mysqlTable("exam_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  score: int("score"),
  totalQuestions: int("totalQuestions").default(20),
  correctAnswers: int("correctAnswers"),
  passed: boolean("passed"),
  answers: json("answers"), // JSON mit Frage-ID -> Antwort
});

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = typeof examAttempts.$inferInsert;

// ============================================
// CERTIFICATES - Zertifikate
// ============================================
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  examAttemptId: int("examAttemptId").notNull(),
  certificateNumber: varchar("certificateNumber", { length: 50 }).notNull().unique(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  pdfUrl: text("pdfUrl"),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;
