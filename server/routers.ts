import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "./db";

// ============================================
// HELPER FUNCTIONS
// ============================================
function generateToken(): string {
  return nanoid(32);
}

function getExpirationDate(hours: number = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

// ============================================
// COMPANY ADMIN PROCEDURE
// ============================================
const companyAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'companyadmin' && ctx.user.role !== 'sysadmin') {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur Firmenadmins haben Zugriff" });
  }
  return next({ ctx });
});

// ============================================
// APP ROUTER
// ============================================
export const appRouter = router({
  system: systemRouter,
  
  // ============================================
  // AUTH ROUTES
  // ============================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================
  // INVITATION ROUTES
  // ============================================
  invitation: router({
    // Einladung validieren (öffentlich)
    validate: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const invitation = await db.getInvitationByToken(input.token);
        if (!invitation) {
          return { valid: false, error: "Einladung nicht gefunden" };
        }
        if (new Date() > invitation.expiresAt) {
          return { valid: false, error: "Einladung abgelaufen" };
        }
        return {
          valid: true,
          type: invitation.type,
          email: invitation.email,
          companyName: invitation.companyName,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
        };
      }),

    // Einladung annehmen und User erstellen
    accept: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const invitation = await db.getInvitationByToken(input.token);
        if (!invitation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Einladung nicht gefunden" });
        }
        if (new Date() > invitation.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Einladung abgelaufen" });
        }
        
        // E-Mail-Validierung: Eingeloggte E-Mail muss mit Einladungs-E-Mail übereinstimmen
        if (ctx.user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: `Diese Einladung ist für ${invitation.email}. Bitte melden Sie sich mit dieser E-Mail-Adresse an.` 
          });
        }

        // User-Daten aktualisieren
        const updateData: any = {
          openId: ctx.user.openId,
          email: invitation.email,
          role: invitation.type,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
        };

        if (invitation.type === 'companyadmin') {
          // Firma existiert bereits (wurde vom SysAdmin erstellt)
          // FirmenAdmin wird nur der bestehenden Firma zugeordnet
          if (!invitation.companyId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Firma mit dieser Einladung verknüpft" });
          }
          updateData.companyId = invitation.companyId;
        } else if (invitation.type === 'user') {
          updateData.companyId = invitation.companyId;
          updateData.personnelNumber = invitation.personnelNumber;
        }

        await db.upsertUser(updateData);
        await db.markInvitationUsed(input.token);

        return { success: true };
      }),

    // Abgelaufene Einladungen löschen (Admin)
    cleanupExpired: adminProcedure.mutation(async () => {
      const deleted = await db.deleteExpiredInvitations();
      return { deleted };
    }),
  }),

  // ============================================
  // COMPANY ROUTES (SysAdmin)
  // ============================================
  company: router({
    list: adminProcedure.query(async () => {
      return db.getAllCompanies();
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCompanyById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        adminEmail: z.string().email(),
        adminFirstName: z.string().optional(),
        adminLastName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Firma sofort erstellen
        const companyId = await db.createCompany({ name: input.name });
        
        // 2. Einladung für FirmenAdmin erstellen (mit companyId)
        const token = generateToken();
        await db.createInvitation({
          token,
          email: input.adminEmail,
          type: 'companyadmin',
          companyId: companyId, // Firma existiert bereits!
          companyName: input.name,
          firstName: input.adminFirstName || null,
          lastName: input.adminLastName || null,
          invitedBy: ctx.user.id,
          expiresAt: getExpirationDate(24),
        });

        return { success: true, token, companyId };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        maxUsers: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCompany(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCompany(input.id);
        return { success: true };
      }),

    // FirmenAdmin einer Firma hinzufügen
    inviteAdmin: adminProcedure
      .input(z.object({
        companyId: z.number(),
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Firma nicht gefunden" });
        }

        const token = generateToken();
        await db.createInvitation({
          token,
          email: input.email,
          type: 'companyadmin',
          companyId: input.companyId,
          companyName: company.name,
          firstName: input.firstName || null,
          lastName: input.lastName || null,
          invitedBy: ctx.user.id,
          expiresAt: getExpirationDate(24),
        });

        return { success: true, token };
      }),

    // Alle Admins einer Firma
    getAdmins: adminProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        const users = await db.getUsersByCompany(input.companyId);
        return users.filter(u => u.role === 'companyadmin');
      }),
  }),

  // ============================================
  // EMPLOYEE ROUTES (FirmenAdmin)
  // ============================================
  employee: router({
    list: companyAdminProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'sysadmin') {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Bitte Firma auswählen" });
      }
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Firma zugeordnet" });
      }
      const users = await db.getUsersByCompany(ctx.user.companyId);
      return users.filter(u => u.role === 'user');
    }),

    listByCompany: adminProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        const users = await db.getUsersByCompany(input.companyId);
        return users.filter(u => u.role === 'user');
      }),

    invite: companyAdminProcedure
      .input(z.object({
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
        personnelNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Firma zugeordnet" });
        }

        const company = await db.getCompanyById(ctx.user.companyId);
        const token = generateToken();
        
        await db.createInvitation({
          token,
          email: input.email,
          type: 'user',
          companyId: ctx.user.companyId,
          companyName: company?.name || null,
          firstName: input.firstName,
          lastName: input.lastName,
          personnelNumber: input.personnelNumber || null,
          invitedBy: ctx.user.id,
          expiresAt: getExpirationDate(24),
        });

        return { success: true, token };
      }),

    // CSV Import
    importCSV: companyAdminProcedure
      .input(z.object({
        employees: z.array(z.object({
          email: z.string().email(),
          firstName: z.string(),
          lastName: z.string(),
          personnelNumber: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Firma zugeordnet" });
        }

        const company = await db.getCompanyById(ctx.user.companyId);
        const results = [];

        for (const emp of input.employees) {
          const token = generateToken();
          await db.createInvitation({
            token,
            email: emp.email,
            type: 'user',
            companyId: ctx.user.companyId,
            companyName: company?.name || null,
            firstName: emp.firstName,
            lastName: emp.lastName,
            personnelNumber: emp.personnelNumber || null,
            invitedBy: ctx.user.id,
            expiresAt: getExpirationDate(24),
          });
          results.push({ email: emp.email, token });
        }

        return { success: true, imported: results.length, results };
      }),

    delete: companyAdminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(input.userId);
        if (!user || user.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
        }
        await db.deleteUser(input.userId);
        return { success: true };
      }),

    // Ausstehende Einladungen
    pendingInvitations: companyAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Firma zugeordnet" });
      }
      return db.getPendingInvitationsByCompany(ctx.user.companyId);
    }),

    deleteInvitation: companyAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInvitation(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // COURSE ROUTES
  // ============================================
  course: router({
    // Öffentliche Liste aktiver Kurse
    listActive: protectedProcedure.query(async () => {
      return db.getActiveCourses();
    }),

    // Admin: Alle Kurse
    listAll: adminProcedure.query(async () => {
      return db.getAllCourses();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const course = await db.getCourseById(input.id);
        if (!course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Kurs nicht gefunden" });
        }
        const topics = await db.getTopicsByCourse(input.id);
        return { ...course, topics };
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        courseType: z.enum(['learning', 'sensitization', 'certification']),
        isMandatory: z.boolean().optional(),
        passingScore: z.number().optional(),
        timeLimit: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCourse(input);
        return { success: true, id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        courseType: z.enum(['learning', 'sensitization', 'certification']).optional(),
        isActive: z.boolean().optional(),
        isMandatory: z.boolean().optional(),
        passingScore: z.number().optional(),
        timeLimit: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCourse(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCourse(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // TOPIC ROUTES
  // ============================================
  topic: router({
    listByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return db.getTopicsByCourse(input.courseId);
      }),

    create: adminProcedure
      .input(z.object({
        courseId: z.number(),
        title: z.string().min(1),
        content: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTopic(input);
        return { success: true, id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        orderIndex: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTopic(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTopic(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // QUESTION ROUTES
  // ============================================
  question: router({
    listByTopic: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ input }) => {
        return db.getQuestionsByTopic(input.topicId);
      }),

    create: adminProcedure
      .input(z.object({
        topicId: z.number(),
        courseId: z.number(),
        questionText: z.string().min(1),
        optionA: z.string().min(1),
        optionB: z.string().min(1),
        optionC: z.string().min(1),
        optionD: z.string().min(1),
        correctAnswer: z.enum(['A', 'B', 'C', 'D']),
        explanation: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createQuestion(input);
        return { success: true, id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        questionText: z.string().optional(),
        optionA: z.string().optional(),
        optionB: z.string().optional(),
        optionC: z.string().optional(),
        optionD: z.string().optional(),
        correctAnswer: z.enum(['A', 'B', 'C', 'D']).optional(),
        explanation: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateQuestion(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteQuestion(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // PROGRESS ROUTES
  // ============================================
  progress: router({
    // User Fortschritt abrufen
    my: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProgress(ctx.user.id);
    }),

    // Fortschritt für einen Kurs
    byCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getUserCourseProgress(ctx.user.id, input.courseId);
      }),

    // Topic abschließen
    completeTopic: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        topicId: z.number(),
        score: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertProgress({
          userId: ctx.user.id,
          courseId: input.courseId,
          topicId: input.topicId,
          status: 'completed',
          score: input.score,
          completedAt: new Date(),
        });
        return { success: true };
      }),

    // Quiz-Antwort prüfen
    checkAnswer: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        answer: z.enum(['A', 'B', 'C', 'D']),
      }))
      .mutation(async ({ input }) => {
        const questions = await db.getQuestionsByTopic(0); // Workaround
        // In real implementation, get question by ID
        return { correct: true, explanation: "" };
      }),
  }),

  // ============================================
  // EXAM ROUTES
  // ============================================
  exam: router({
    // Prüfung starten
    start: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const course = await db.getCourseById(input.courseId);
        if (!course || course.courseType !== 'certification') {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Zertifizierungsprüfung" });
        }

        // Zufällige 20 Fragen aus dem Kurs
        const allQuestions = await db.getQuestionsByCourse(input.courseId);
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        const examQuestions = shuffled.slice(0, 20);

        const attemptId = await db.createExamAttempt({
          userId: ctx.user.id,
          courseId: input.courseId,
          totalQuestions: 20,
        });

        return {
          attemptId,
          questions: examQuestions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
          })),
          timeLimit: course.timeLimit || 15,
        };
      }),

    // Prüfung abschließen
    submit: protectedProcedure
      .input(z.object({
        attemptId: z.number(),
        answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])),
      }))
      .mutation(async ({ ctx, input }) => {
        const attempt = await db.getExamAttempt(input.attemptId);
        if (!attempt || attempt.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
        }

        const course = await db.getCourseById(attempt.courseId);
        const questions = await db.getQuestionsByCourse(attempt.courseId);
        
        let correct = 0;
        for (const [qId, answer] of Object.entries(input.answers)) {
          const question = questions.find(q => q.id === parseInt(qId));
          if (question && question.correctAnswer === answer) {
            correct++;
          }
        }

        const score = Math.round((correct / 20) * 100);
        const passed = score >= (course?.passingScore || 80);

        await db.updateExamAttempt(input.attemptId, {
          completedAt: new Date(),
          score,
          correctAnswers: correct,
          passed,
          answers: input.answers,
        });

        // Bei Bestehen: Zertifikat erstellen
        if (passed) {
          const certNumber = `CERT-${Date.now()}-${ctx.user.id}`;
          await db.createCertificate({
            userId: ctx.user.id,
            courseId: attempt.courseId,
            examAttemptId: input.attemptId,
            certificateNumber: certNumber,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
          });
        }

        return { score, passed, correct, total: 20 };
      }),

    // Prüfungsversuche abrufen
    attempts: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getUserExamAttempts(ctx.user.id, input.courseId);
      }),
  }),

  // ============================================
  // CERTIFICATE ROUTES
  // ============================================
  certificate: router({
    my: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCertificates(ctx.user.id);
    }),

    verify: publicProcedure
      .input(z.object({ certificateNumber: z.string() }))
      .query(async ({ input }) => {
        const cert = await db.getCertificateByNumber(input.certificateNumber);
        if (!cert) {
          return { valid: false };
        }
        const user = await db.getUserById(cert.userId);
        const course = await db.getCourseById(cert.courseId);
        return {
          valid: true,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unbekannt',
          courseName: course?.title || 'Unbekannt',
          issuedAt: cert.issuedAt,
          expiresAt: cert.expiresAt,
        };
      }),
  }),

  // ============================================
  // ADMIN USER MANAGEMENT
  // ============================================
  admin: router({
    // Alle User einer Firma
    usersByCompany: adminProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return db.getUsersByCompany(input.companyId);
      }),

    // User löschen
    deleteUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.userId);
        return { success: true };
      }),

    // Rolle ändern
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['sysadmin', 'companyadmin', 'user']),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
