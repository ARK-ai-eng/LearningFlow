import { getDb } from "./db";
import { securityLogs } from "../drizzle/schema";

/**
 * Security Event Actions
 */
export type SecurityAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "ADMIN_PASSWORD_RESET"
  | "INVITATION_ACCEPTED"
  | "EXAM_COMPLETED"
  | "CERTIFICATE_CREATED"
  | "RATE_LIMIT_EXCEEDED";

/**
 * Zentrale Funktion zum Loggen von Security-Events
 * 
 * @param action - Art des Events (LOGIN_SUCCESS, LOGIN_FAILED, etc.)
 * @param userId - User-ID (nullable für LOGIN_FAILED)
 * @param companyId - Company-ID (nullable)
 * @param metadata - Zusätzliche Daten (z.B. { email, reason, oldRole, newRole })
 * @param ipAddress - IP-Adresse des Clients
 * @param userAgent - User-Agent des Clients
 */
export async function logSecurityEvent(
  action: SecurityAction,
  userId: number | null,
  companyId: number | null,
  metadata: Record<string, any> | null,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[SECURITY-LOG] Datenbankverbindung fehlgeschlagen");
      return;
    }

    await db.insert(securityLogs).values({
      userId,
      companyId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
    });

    console.log(`[SECURITY-LOG] ${action} - User: ${userId}, Company: ${companyId}`);
  } catch (error) {
    // Fehler beim Loggen sollte nicht die Hauptfunktion blockieren
    console.error("[SECURITY-LOG] Fehler beim Loggen:", error);
  }
}

/**
 * Extrahiert IP-Adresse aus tRPC-Request
 * 
 * @param req - Express Request Object (aus ctx.req)
 * @returns IP-Adresse oder null
 */
export function getClientIp(req: any): string | null {
  if (!req) return null;
  
  // Prüfe X-Forwarded-For Header (für Proxies/Load Balancers)
  const forwardedFor = req.headers?.["x-forwarded-for"];
  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    return ips[0].trim(); // Erste IP ist Client-IP
  }
  
  // Fallback: req.ip oder req.connection.remoteAddress
  return req.ip || req.connection?.remoteAddress || null;
}

/**
 * Extrahiert User-Agent aus tRPC-Request
 * 
 * @param req - Express Request Object (aus ctx.req)
 * @returns User-Agent oder null
 */
export function getClientUserAgent(req: any): string | null {
  if (!req) return null;
  return req.headers?.["user-agent"] || null;
}
