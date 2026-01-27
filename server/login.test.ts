import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createToken, verifyToken } from './auth';

describe('Auth System', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    it('should create a valid token', () => {
      const token = createToken(1, 'test@example.com', 'user');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify a valid token', () => {
      const token = createToken(1, 'test@example.com', 'user');
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(1);
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('user');
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should include all user roles', () => {
      const roles = ['sysadmin', 'companyadmin', 'user'] as const;
      
      for (const role of roles) {
        const token = createToken(1, 'test@example.com', role);
        const decoded = verifyToken(token);
        expect(decoded?.role).toBe(role);
      }
    });
  });
});
