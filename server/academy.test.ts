import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getAllCompanies: vi.fn().mockResolvedValue([
    { id: 1, name: "Test GmbH", status: "active", maxUsers: 100, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getCompanyById: vi.fn().mockResolvedValue(
    { id: 1, name: "Test GmbH", status: "active", maxUsers: 100, createdAt: new Date(), updatedAt: new Date() }
  ),
  getAllCourses: vi.fn().mockResolvedValue([
    { id: 1, title: "Datenschutz", courseType: "learning", isActive: true, isMandatory: false }
  ]),
  getActiveCourses: vi.fn().mockResolvedValue([
    { id: 1, title: "Datenschutz", courseType: "learning", isActive: true, isMandatory: false }
  ]),
  getCourseById: vi.fn().mockResolvedValue(
    { id: 1, title: "Datenschutz", courseType: "certification", isActive: true, passingScore: 80, timeLimit: 15 }
  ),
  getTopicsByCourse: vi.fn().mockResolvedValue([
    { id: 1, courseId: 1, title: "Thema 1", orderIndex: 1 }
  ]),
  getQuestionsByTopic: vi.fn().mockResolvedValue([
    { id: 1, topicId: 1, questionText: "Frage?", optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctAnswer: "A" }
  ]),
  getQuestionsByCourse: vi.fn().mockResolvedValue(
    Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      topicId: 1,
      courseId: 1,
      questionText: `Frage ${i + 1}?`,
      optionA: "A",
      optionB: "B",
      optionC: "C",
      optionD: "D",
      correctAnswer: "A"
    }))
  ),
  getUserProgress: vi.fn().mockResolvedValue([]),
  getUserCertificates: vi.fn().mockResolvedValue([]),
  getInvitationByToken: vi.fn().mockResolvedValue({
    token: "test-token",
    email: "test@test.de",
    type: "user",
    companyId: 1,
    firstName: "Max",
    lastName: "Mustermann",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }),
  createExamAttempt: vi.fn().mockResolvedValue(1),
  getExamAttempt: vi.fn().mockResolvedValue({
    id: 1,
    userId: 2, // Match user context id
    courseId: 1,
    totalQuestions: 20
  }),
  updateExamAttempt: vi.fn().mockResolvedValue(undefined),
  createCertificate: vi.fn().mockResolvedValue(1),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  markInvitationUsed: vi.fn().mockResolvedValue(undefined),
}));

function createSysAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@test.de",
      name: "Admin",
      firstName: "Admin",
      lastName: "User",
      loginMethod: "manus",
      role: "sysadmin",
      companyId: null,
      personnelNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      email: "user@test.de",
      name: "User",
      firstName: "Test",
      lastName: "User",
      loginMethod: "manus",
      role: "user",
      companyId: 1,
      personnelNumber: "MA-001",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createCompanyAdminContext(): TrpcContext {
  return {
    user: {
      id: 3,
      openId: "companyadmin-open-id",
      email: "companyadmin@test.de",
      name: "Company Admin",
      firstName: "Company",
      lastName: "Admin",
      loginMethod: "manus",
      role: "companyadmin",
      companyId: 1,
      personnelNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Auth Router", () => {
  it("returns user for auth.me when authenticated", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    
    expect(result).toBeDefined();
    expect(result?.email).toBe("user@test.de");
    expect(result?.role).toBe("user");
  });

  it("returns null for auth.me when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    
    expect(result).toBeNull();
  });
});

describe("Company Router (SysAdmin)", () => {
  it("lists companies for sysadmin", async () => {
    const ctx = createSysAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.company.list();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test GmbH");
  });

  it("denies company list for regular user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.company.list()).rejects.toThrow();
  });
});

describe("Course Router", () => {
  it("lists active courses for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.course.listActive();
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Datenschutz");
  });

  it("gets course with topics", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.course.get({ id: 1 });
    
    expect(result.title).toBe("Datenschutz");
    expect(result.topics).toHaveLength(1);
  });
});

describe("Progress Router", () => {
  it("returns user progress", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.progress.my();
    
    expect(result).toEqual([]);
  });
});

describe("Exam Router", () => {
  it("starts exam for certification course", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.exam.start({ courseId: 1 });
    
    expect(result.attemptId).toBe(1);
    expect(result.questions).toHaveLength(20);
    expect(result.timeLimit).toBe(15);
  });

  it("submits exam and calculates score", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    // All correct answers (A)
    const answers: Record<string, "A" | "B" | "C" | "D"> = {};
    for (let i = 1; i <= 20; i++) {
      answers[i.toString()] = "A";
    }
    
    const result = await caller.exam.submit({ attemptId: 1, answers });
    
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.correct).toBe(20);
    expect(result.total).toBe(20);
  });
});

describe("Certificate Router", () => {
  it("returns user certificates", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.certificate.my();
    
    expect(result).toEqual([]);
  });
});

describe("Invitation Router", () => {
  it("validates valid invitation token", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.invitation.validate({ token: "test-token" });
    
    expect(result.valid).toBe(true);
    expect(result.email).toBe("test@test.de");
  });
});
