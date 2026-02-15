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
  // PUBLIC ROUTES
  // ============================================
  public: router({
    // Kontaktformular E-Mail senden
    sendContactEmail: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        subject: z.string().min(1),
        message: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate-Limiting prüfen
        const { checkRateLimit, getClientIp, formatResetTime } = await import('./rateLimit');
        const clientIp = getClientIp(ctx.req.headers);
        const rateLimit = checkRateLimit(clientIp);
        
        if (!rateLimit.allowed) {
          const resetTime = formatResetTime(rateLimit.resetAt);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Zu viele Anfragen. Bitte versuchen Sie es in ${resetTime} erneut.`,
          });
        }
        
        // E-Mail senden
        const { sendContactEmail } = await import('./email');
        
        const result = await sendContactEmail({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        });
        
        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error || 'E-Mail konnte nicht gesendet werden',
          });
        }
        
        return { success: true };
      }),
  }),
  
  // ============================================
  // AUTH ROUTES
  // ============================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Login mit E-Mail + Passwort
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { verifyPassword, createToken } = await import('./auth');
        
        const user = await db.getUserByEmail(input.email.toLowerCase());
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-Mail oder Passwort falsch" });
        }
        if (!user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Bitte nutzen Sie den Einladungslink um Ihr Passwort zu setzen" });
        }
        
        const validPassword = await verifyPassword(input.password, user.passwordHash);
        if (!validPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-Mail oder Passwort falsch" });
        }
        
        // Last sign in aktualisieren (asynchron, blockiert Response nicht)
        db.updateUserLastSignedIn(user.id).catch(err => console.error('[Login] Failed to update lastSignedIn:', err));
        
        // JWT Token erstellen
        const token = createToken(user.id, user.email, user.role);
        
        // Cookie setzen (Fallback)
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
        
        // Token auch zurückgeben für localStorage (Hauptmethode)
        // + User-Daten für optimistisches Caching (verhindert Skeleton-Flicker)
        return { 
          success: true, 
          role: user.role, 
          token,
          userId: user.id,
          email: user.email,
          name: user.name,
          companyId: user.companyId,
        };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // HINWEIS: exchangeToken wurde entfernt!
    // Auth-Bootstrap läuft jetzt über REST: POST /api/auth/exchange-session
    // Grund: OAuth-Flows sind redirect-basiert und müssen vor tRPC-Initialisierung abgeschlossen sein
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

    // Einladung annehmen und Passwort setzen (OHNE Manus OAuth)
    accept: publicProcedure
      .input(z.object({ 
        token: z.string(),
        password: z.string().min(8),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hashPassword, validatePassword, createToken } = await import('./auth');
        
        const invitation = await db.getInvitationByToken(input.token);
        if (!invitation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Einladung nicht gefunden" });
        }
        if (new Date() > invitation.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Einladung abgelaufen" });
        }
        if (invitation.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Einladung wurde bereits verwendet" });
        }
        
        // Passwort validieren
        const pwValidation = validatePassword(input.password);
        if (!pwValidation.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: pwValidation.error });
        }

        // Passwort hashen
        const passwordHash = await hashPassword(input.password);

        // User erstellen
        const userData: any = {
          email: invitation.email,
          passwordHash,
          role: invitation.type,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          name: `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim() || null,
        };

        if (invitation.type === 'companyadmin') {
          if (!invitation.companyId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Firma mit dieser Einladung verknüpft" });
          }
          userData.companyId = invitation.companyId;
        } else if (invitation.type === 'user') {
          userData.companyId = invitation.companyId;
          userData.personnelNumber = invitation.personnelNumber;
        }

        const userId = await db.createUser(userData);
        await db.markInvitationUsed(invitation.id);

        // JWT Token erstellen und Cookie setzen
        const token = createToken(userId, invitation.email, invitation.type);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

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
        adminPassword: z.string().min(8),
        adminFirstName: z.string().optional(),
        adminLastName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hashPassword, validatePassword } = await import('./auth');
        const email = input.adminEmail.toLowerCase();
        
        // E-MAIL-DUPLIKAT-PRÜFUNG
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Diese E-Mail-Adresse ist bereits registriert" 
          });
        }
        
        // Passwort validieren
        const pwValidation = validatePassword(input.adminPassword);
        if (!pwValidation.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: pwValidation.error });
        }
        
        // Passwort hashen
        const passwordHash = await hashPassword(input.adminPassword);
        
        // 1. Firma erstellen
        const companyId = await db.createCompany({ name: input.name });
        
        // 2. FirmenAdmin direkt erstellen (keine Einladung)
        await db.createUser({
          email: email,
          passwordHash,
          role: 'companyadmin',
          companyId: companyId,
          firstName: input.adminFirstName || null,
          lastName: input.adminLastName || null,
        });

        return { success: true, companyId };
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
        const email = input.email.toLowerCase();
        
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Firma nicht gefunden" });
        }

        // E-MAIL-DUPLIKAT-PRÜFUNG
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Diese E-Mail-Adresse ist bereits registriert" 
          });
        }
        
        const existingInvitation = await db.getActiveInvitationByEmail(email);
        if (existingInvitation) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Für diese E-Mail-Adresse existiert bereits eine aktive Einladung" 
          });
        }

        const token = generateToken();
        await db.createInvitation({
          token,
          email: email,
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
        return users.filter((u: any) => u.role === 'companyadmin');
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
      return users.filter((u: any) => u.role === 'user');
    }),

    listByCompany: adminProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        const users = await db.getUsersByCompany(input.companyId);
        return users.filter((u: any) => u.role === 'user');
      }),

    // Mitarbeiter direkt erstellen (ohne Einladung)
    create: companyAdminProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string(),
        lastName: z.string(),
        personnelNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { hashPassword, validatePassword } = await import('./auth');
        
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Firma zugeordnet" });
        }
        
        const email = input.email.toLowerCase();

        // E-MAIL-DUPLIKAT-PRÜFUNG
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
          throw new TRPCError({ 
            code: "CONFLICT", 
            message: "Diese E-Mail-Adresse ist bereits registriert" 
          });
        }
        
        // Passwort validieren
        const pwValidation = validatePassword(input.password);
        if (!pwValidation.valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: pwValidation.error });
        }
        
        // Passwort hashen
        const passwordHash = await hashPassword(input.password);
        
        // User direkt erstellen
        await db.createUser({
          email: email,
          passwordHash,
          role: 'user',
          companyId: ctx.user.companyId,
          firstName: input.firstName,
          lastName: input.lastName,
          personnelNumber: input.personnelNumber || null,
        });

        return { success: true };
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
        const results: { email: string; token?: string; error?: string }[] = [];
        const skipped: string[] = [];

        for (const emp of input.employees) {
          const email = emp.email.toLowerCase();
          
          // E-MAIL-DUPLIKAT-PRÜFUNG
          const existingUser = await db.getUserByEmail(email);
          if (existingUser) {
            results.push({ email, error: "E-Mail bereits registriert" });
            skipped.push(email);
            continue;
          }
          
          const existingInvitation = await db.getActiveInvitationByEmail(email);
          if (existingInvitation) {
            results.push({ email, error: "Aktive Einladung existiert bereits" });
            skipped.push(email);
            continue;
          }

          const token = generateToken();
          await db.createInvitation({
            token,
            email: email,
            type: 'user',
            companyId: ctx.user.companyId,
            companyName: company?.name || null,
            firstName: emp.firstName,
            lastName: emp.lastName,
            personnelNumber: emp.personnelNumber || null,
            invitedBy: ctx.user.id,
            expiresAt: getExpirationDate(24),
          });
          results.push({ email, token });
        }

        const imported = results.filter(r => r.token).length;
        return { 
          success: true, 
          imported, 
          skipped: skipped.length,
          results 
        };
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
    // Öffentliche Liste aktiver Kurse (mit Progress-Stats)
    listActive: protectedProcedure.query(async ({ ctx }) => {
      const courses = await db.getActiveCourses();
      // Füge Stats für jeden Kurs hinzu
      const coursesWithStats = await Promise.all(
        courses.map(async (course: any) => {
          // Berechne Stats wie in question.getCourseStats
          const questions = await db.getQuestionsByCourse(course.id);
          const progress = await db.getQuestionProgressByCourse(ctx.user.id, course.id);
          
          const total = questions.length;
          const answered = progress.filter((p: any) => p.firstAttemptStatus !== 'unanswered').length;
          const correct = progress.filter((p: any) => p.firstAttemptStatus === 'correct').length;
          const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
          
          return { ...course, stats: { total, answered, correct, percentage } };
        })
      );
      return coursesWithStats;
    }),

    // Admin: Alle Kurse
    listAll: adminProcedure.query(async () => {
      return db.getAllCourses();
    }),

    // Admin: Kurse mit Filter (all/active/inactive) und Sortierung
    list: adminProcedure
      .input(z.object({
        status: z.enum(['all', 'active', 'inactive']).default('all'),
      }))
      .query(async ({ input }) => {
        const courses = await db.getAllCourses();
        
        // Filter nach Status
        let filtered = courses;
        if (input.status === 'active') {
          filtered = courses.filter((c: typeof courses[0]) => c.isActive);
        } else if (input.status === 'inactive') {
          filtered = courses.filter((c: typeof courses[0]) => !c.isActive);
        }
        
        // Sortierung: Aktive zuerst, dann inaktive
        filtered.sort((a: typeof courses[0], b: typeof courses[0]) => {
          if (a.isActive === b.isActive) return 0;
          return a.isActive ? -1 : 1;
        });
        
        return filtered;
      }),

    // Admin: Kurs deaktivieren (Soft-Delete)
    deactivate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateCourse(input.id, { isActive: false });
        return { success: true };
      }),

    // Admin: Kurs aktivieren
    activate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateCourse(input.id, { isActive: true });
        return { success: true };
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

    // Kurs-Wiederholung: Setzt Progress zurück, behält lastCompletedAt
    resetProgress: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.resetQuestionProgressByCourse(ctx.user.id, input.courseId);
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
      .input(z.object({ 
        topicId: z.number(),
        isExamQuestion: z.boolean().optional() // Optional: Filter für Lern- oder Prüfungsfragen
      }))
      .query(async ({ input }) => {
        return db.getQuestionsByTopic(input.topicId, {
          isExamQuestion: input.isExamQuestion
        });
      }),

    // Holt alle Fragen eines Kurses (für Kurs-basiertes Quiz)
    listByCourse: protectedProcedure
      .input(z.object({ 
        courseId: z.number(),
        isExamQuestion: z.boolean().optional() // Optional: Filter für Lern- oder Prüfungsfragen
      }))
      .query(async ({ input }) => {
        return db.getQuestionsByCourse(input.courseId, {
          isExamQuestion: input.isExamQuestion
        });
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
        isExamQuestion: z.boolean().optional().default(false), // DEFAULT false für Lernfragen
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
        isExamQuestion: z.boolean().optional(), // Admin kann Frage umwandeln (Lern → Prüfung)
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

    // Get question with shuffled answers (for sensitization courses)
    getWithShuffledAnswers: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { shuffleQuestionAnswers } = await import('./shuffle');
        const question = await db.getQuestionById(input.id);
        
        if (!question) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Frage nicht gefunden' });
        }
        
        // Shuffle answers
        const shuffled = shuffleQuestionAnswers({
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctAnswer: question.correctAnswer,
        });
        
        return {
          ...question,
          optionA: shuffled.optionA,
          optionB: shuffled.optionB,
          optionC: shuffled.optionC,
          optionD: shuffled.optionD,
          correctAnswer: shuffled.correctAnswer,
        };
      }),

    // Holt Fortschritt für alle Fragen eines Themas
    getProgress: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getQuestionProgressByTopic(ctx.user.id, input.topicId);
      }),

    // Speichert Antwort und aktualisiert Fortschritt
    submitAnswer: protectedProcedure
      .input(z.object({
        questionId: z.number(),
        topicId: z.number(),
        courseId: z.number(),
        isCorrect: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Speichere Fragen-Fortschritt
        // WICHTIG: firstAttemptStatus wird in upsertQuestionProgress korrekt gesetzt
        await db.upsertQuestionProgress({
          userId: ctx.user.id,
          questionId: input.questionId,
          topicId: input.topicId,
          isCorrect: input.isCorrect, // Changed from 'status' to 'isCorrect'
        });

        // 2. Prüfe ob alle Fragen des Topics beantwortet wurden
        const topicQuestions = await db.getQuestionsByTopic(input.topicId);
        const topicProgress = await db.getQuestionProgressByTopic(ctx.user.id, input.topicId);
        
        const allAnswered = topicQuestions.length > 0 && topicProgress.length === topicQuestions.length;
        
        if (allAnswered) {
          // Berechne Score (Prozent korrekt) basierend auf FIRST ATTEMPT
          // WICHTIG: Verwende firstAttemptStatus, nicht status! (ADR-013)
          const correctCount = topicProgress.filter(p => p.firstAttemptStatus === 'correct').length;
          const score = Math.round((correctCount / topicQuestions.length) * 100);
          
          // Aktualisiere user_progress für dieses Topic
          await db.upsertProgress({
            userId: ctx.user.id,
            courseId: input.courseId,
            topicId: input.topicId,
            status: 'completed',
            score,
            completedAt: new Date(),
          });
        }

        return { success: true };
      }),

    // Holt nur falsch beantwortete Fragen eines Themas
    getIncorrectQuestions: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getIncorrectQuestionsByTopic(ctx.user.id, input.topicId);
      }),

    // Berechnet Fortschritt für einen Kurs (alle Fragen)
    getProgressByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getQuestionProgressByCourse(ctx.user.id, input.courseId);
      }),

    // Berechnet Statistik für einen Kurs
    getCourseStats: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const questions = await db.getQuestionsByCourse(input.courseId);
        const progress = await db.getQuestionProgressByCourse(ctx.user.id, input.courseId);
        
        const total = questions.length;
        // Zähle nur Fragen die wirklich beantwortet wurden (nicht unanswered nach Reset)
        const answered = progress.filter((p: any) => p.firstAttemptStatus !== 'unanswered').length;
        // WICHTIG: Fortschritt basiert auf firstAttemptStatus, nicht status! (Option B)
        const correct = progress.filter((p: any) => p.firstAttemptStatus === 'correct').length;
        const incorrect = progress.filter((p: any) => p.firstAttemptStatus === 'incorrect').length;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        // Topic-Fortschritt berechnen
        const topics = await db.getTopicsByCourse(input.courseId);
        const topicProgress = await Promise.all(
          topics.map(async (topic: any) => {
            const topicQuestions = await db.getQuestionsByTopic(topic.id);
            const topicProg = await db.getQuestionProgressByTopic(ctx.user.id, topic.id);
            // Zähle nur wirklich beantwortete Fragen (nicht unanswered nach Reset)
            const answered = topicProg.filter((p: any) => p.firstAttemptStatus !== 'unanswered').length;
            return {
              topicId: topic.id,
              topicTitle: topic.title,
              total: topicQuestions.length,
              answered,
              // WICHTIG: Fortschritt basiert auf firstAttemptStatus, nicht status! (Option B)
              correct: topicProg.filter((p: any) => p.firstAttemptStatus === 'correct').length,
              percentage: topicQuestions.length > 0 ? Math.round((topicProg.filter((p: any) => p.firstAttemptStatus === 'correct').length / topicQuestions.length) * 100) : 0,
            };
          })
        );
        
        // Hole lastCompletedAt vom ersten Progress-Eintrag (alle haben denselben Wert)
        const lastCompletedAt = progress.length > 0 && progress[0].lastCompletedAt 
          ? progress[0].lastCompletedAt 
          : null;
        
        return {
          courseId: input.courseId,
          total,
          answered,
          correct,
          incorrect,
          percentage,
          topicProgress,
          lastCompletedAt,
        };
      }),

    // Setzt Fortschritt für einen Kurs zurück (löscht alle question_progress Einträge)
    resetCourseProgress: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.resetQuestionProgressByCourse(ctx.user.id, input.courseId);
        return { success: true };
      }),

    // Holt zufällige unbeantwortete Frage für Resume-Funktionalität
    getRandomUnanswered: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const question = await db.getRandomUnansweredQuestion(ctx.user.id, input.courseId);
        if (!question) return null;
        return {
          id: question.id,
          topicId: question.topicId,
        };
      }),

    // Berechnet Fortschritt für ein Thema (% richtig beantwortet)
    getTopicProgress: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .query(async ({ ctx, input }) => {
        const questions = await db.getQuestionsByTopic(input.topicId);
        const progress = await db.getQuestionProgressByTopic(ctx.user.id, input.topicId);
        
        const total = questions.length;
        const answered = progress.length;
        const correct = progress.filter(p => p.status === 'correct').length;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        return {
          topicId: input.topicId,
          total,
          answered,
          correct,
          incorrect: answered - correct,
          percentage,
        };
      }),

    // Berechnet Fortschritt für einen Kurs (% aller Fragen richtig)
    getCourseProgress: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const course = await db.getCourseById(input.courseId);
        if (!course) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Kurs nicht gefunden' });
        }
        
        // Topics laden
        const topics = await db.getTopicsByCourse(input.courseId);
        console.log('[getCourseProgress] Topics loaded:', topics.length);
        const courseWithTopics = { ...course, topics };

        // Alle Fragen des Kurses holen
        const allQuestions = await db.getQuestionsByCourse(input.courseId);
        const totalQuestions = allQuestions.length;
        
        if (totalQuestions === 0) {
          return {
            courseId: input.courseId,
            totalQuestions: 0,
            answeredQuestions: 0,
            correctAnswers: 0,
            percentage: 0,
            topicProgress: [],
          };
        }

        // Fortschritt für alle Topics holen
        const topicProgress = await Promise.all(
          courseWithTopics.topics.map(async (topic: any) => {
            const questions = await db.getQuestionsByTopic(topic.id);
            const progress = await db.getQuestionProgressByTopic(ctx.user.id, topic.id);
            
            const total = questions.length;
            const answered = progress.filter(p => p.firstAttemptStatus !== 'unanswered').length;
            const correct = progress.filter(p => p.status === 'correct').length;
            const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
            
            console.log(`[getCourseProgress] Topic ${topic.id} (${topic.title}): ${total} questions, ${answered} answered, ${correct} correct`);
            
            return {
              topicId: topic.id,
              topicTitle: topic.title,
              total,
              answered,
              correct,
              percentage,
            };
          })
        );

        // Gesamt-Fortschritt berechnen
        const answeredQuestions = topicProgress.reduce((sum, t) => sum + t.answered, 0);
        const correctAnswers = topicProgress.reduce((sum, t) => sum + t.correct, 0);
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        return {
          courseId: input.courseId,
          totalQuestions,
          answeredQuestions,
          correctAnswers,
          percentage,
          topicProgress,
        };
      }),

    // Get incorrect questions for a course (for repeat mode)
    getIncorrectQuestionsByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getIncorrectQuestionsByCourse(ctx.user.id, input.courseId);
      }),

    // Get unanswered questions for a course (for first time)
    getUnansweredQuestionsByCourse: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getUnansweredQuestionsByCourse(ctx.user.id, input.courseId);
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
        const question = await db.getQuestionById(input.questionId);
        if (!question) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Frage nicht gefunden' });
        }
        const correct = input.answer === question.correctAnswer;
        return { 
          correct, 
          correctAnswer: question.correctAnswer,
          explanation: question.explanation || "" 
        };
      }),

    // Get incorrect questions for a topic (for review/repeat)
    getIncorrectQuestions: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        topicId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        // This would require tracking incorrect answers in the database
        // For now, return empty array (to be implemented with answer tracking)
        return [];
      }),

  }),


  // ============================================
  // CERTIFICATE ROUTES
  // ============================================
  certificate: router({
    // Eigene Zertifikate abrufen
    my: protectedProcedure.query(async ({ ctx }) => {
      const certs = await db.getUserCertificates(ctx.user.id);
      // Kursnamen hinzufügen
      const certsWithCourse = await Promise.all(certs.map(async (cert: any) => {
        const course = await db.getCourseById(cert.courseId);
        return {
          ...cert,
          courseName: course?.title || 'Unbekannt',
        };
      }));
      return certsWithCourse;
    }),

    // PDF generieren und URL zurückgeben
    generatePdf: protectedProcedure
      .input(z.object({ certificateId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const cert = await db.getCertificateById(input.certificateId);
        if (!cert || cert.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
        }

        // Wenn PDF bereits existiert, URL zurückgeben
        if (cert.pdfUrl) {
          return { url: cert.pdfUrl };
        }

        // PDF generieren
        const { generateCertificatePdf } = await import('./certificatePdf');
        const user = await db.getUserById(cert.userId);
        const course = await db.getCourseById(cert.courseId);
        const attempt = await db.getExamAttempt(cert.examAttemptId);
        const company = user?.companyId ? await db.getCompanyById(user.companyId) : null;

        const pdfUrl = await generateCertificatePdf({
          certificateNumber: cert.certificateNumber,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unbekannt' : 'Unbekannt',
          courseName: course?.title || 'Unbekannt',
          issuedAt: cert.issuedAt,
          expiresAt: cert.expiresAt,
          score: attempt?.score || 0,
          companyName: company?.name,
        });

        // URL in DB speichern
        await db.updateCertificatePdfUrl(cert.id, pdfUrl);

        return { url: pdfUrl };
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
  // EXAM
  // ============================================
  exam: router({
    // Record exam completion (DSGVO-konform: kein PDF gespeichert)
    recordCompletion: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        score: z.number().min(0).max(100),
        passed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const completionId = await db.recordExamCompletion({
          userId: ctx.user.id,
          courseId: input.courseId,
          score: input.score,
          passed: input.passed,
        });
        return { completionId };
      }),

    // Get latest exam completion
    getLatestCompletion: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getLatestExamCompletion(ctx.user.id, input.courseId);
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
