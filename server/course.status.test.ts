import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('Course Status Management', () => {
  let testCourseId: number;
  let sysAdminContext: any;

  beforeAll(async () => {
    // Setup: SysAdmin context
    const sysAdmin = await db.getUserByEmail('arton.ritter@aismarterflow.de');
    if (!sysAdmin) throw new Error('SysAdmin not found');

    sysAdminContext = {
      user: sysAdmin,
      req: {} as any,
      res: {} as any,
    };

    // Setup: Create test course
    const caller = appRouter.createCaller(sysAdminContext);
    const result = await caller.course.create({
      title: 'Test Course for Status Management',
      description: 'Test course to test activate/deactivate',
      courseType: 'learning',
    });
    testCourseId = result.id;
  });

  describe('course.list', () => {
    it('should return all courses when status=all', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      const courses = await caller.course.list({ status: 'all' });
      
      expect(courses).toBeDefined();
      expect(Array.isArray(courses)).toBe(true);
      expect(courses.length).toBeGreaterThan(0);
    });

    it('should return only active courses when status=active', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      const courses = await caller.course.list({ status: 'active' });
      
      expect(courses).toBeDefined();
      expect(Array.isArray(courses)).toBe(true);
      expect(courses.every((c: any) => c.isActive === true)).toBe(true);
    });

    it('should return only inactive courses when status=inactive', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      
      // First deactivate test course
      await caller.course.deactivate({ id: testCourseId });
      
      const courses = await caller.course.list({ status: 'inactive' });
      
      expect(courses).toBeDefined();
      expect(Array.isArray(courses)).toBe(true);
      expect(courses.every((c: any) => c.isActive === false)).toBe(true);
      
      // Cleanup: Reactivate
      await caller.course.activate({ id: testCourseId });
    });

    it('should sort active courses first, then inactive', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      
      // Deactivate test course
      await caller.course.deactivate({ id: testCourseId });
      
      const courses = await caller.course.list({ status: 'all' });
      
      // Find first inactive course
      const firstInactiveIndex = courses.findIndex((c: any) => !c.isActive);
      
      if (firstInactiveIndex > 0) {
        // All courses before first inactive should be active
        for (let i = 0; i < firstInactiveIndex; i++) {
          expect(courses[i].isActive).toBe(true);
        }
      }
      
      // Cleanup: Reactivate
      await caller.course.activate({ id: testCourseId });
    });
  });

  describe('course.deactivate', () => {
    it('should deactivate a course', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      
      // Deactivate
      const result = await caller.course.deactivate({ id: testCourseId });
      expect(result.success).toBe(true);
      
      // Verify
      const course = await db.getCourseById(testCourseId);
      expect(course?.isActive).toBe(false);
      
      // Cleanup: Reactivate
      await caller.course.activate({ id: testCourseId });
    });

    it('should return success even if course is already inactive', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      
      // Deactivate twice
      await caller.course.deactivate({ id: testCourseId });
      const result = await caller.course.deactivate({ id: testCourseId });
      
      expect(result.success).toBe(true);
      
      // Cleanup: Reactivate
      await caller.course.activate({ id: testCourseId });
    });
  });

  describe('course.activate', () => {
    it('should activate a course', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      
      // First deactivate
      await caller.course.deactivate({ id: testCourseId });
      
      // Then activate
      const result = await caller.course.activate({ id: testCourseId });
      expect(result.success).toBe(true);
      
      // Verify
      const course = await db.getCourseById(testCourseId);
      expect(course?.isActive).toBe(true);
    });

    it('should return success even if course is already active', async () => {
      const caller = appRouter.createCaller(sysAdminContext);
      
      // Activate twice
      await caller.course.activate({ id: testCourseId });
      const result = await caller.course.activate({ id: testCourseId });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Authorization', () => {
    it('should deny access to non-admin users', async () => {
      // Create a regular user context
      const regularUser = {
        id: 999,
        email: 'test@example.com',
        role: 'user' as const,
        companyId: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        passwordHash: null,
        name: null,
        firstName: null,
        lastName: null,
        personnelNumber: null,
        loginMethod: null,
      };

      const userContext = {
        user: regularUser,
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(userContext);
      
      // Should throw FORBIDDEN error
      await expect(caller.course.list({ status: 'all' })).rejects.toThrow();
      await expect(caller.course.deactivate({ id: testCourseId })).rejects.toThrow();
      await expect(caller.course.activate({ id: testCourseId })).rejects.toThrow();
    });
  });
});
