import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from './_core/env';

const SALT_ROUNDS = 12;

// Passwort hashen
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Passwort prüfen
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token erstellen (7 Tage gültig, für Session)
export function createToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    ENV.jwtSecret,
    { expiresIn: '7d' }
  );
}

// Kurzlebiges Exchange-Token (60 Sekunden, nur für Token-Austausch)
export function createExchangeToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role, type: 'exchange' },
    ENV.jwtSecret,
    { expiresIn: '60s' }
  );
}

// Exchange-Token verifizieren
export function verifyExchangeToken(token: string): { userId: number; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, ENV.jwtSecret) as any;
    if (decoded.type !== 'exchange') return null;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

// JWT Token verifizieren
export function verifyToken(token: string): { userId: number; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, ENV.jwtSecret) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

// Passwort-Validierung
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Passwort muss mindestens 8 Zeichen lang sein' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens einen Großbuchstaben enthalten' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens einen Kleinbuchstaben enthalten' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens eine Zahl enthalten' };
  }
  return { valid: true };
}
