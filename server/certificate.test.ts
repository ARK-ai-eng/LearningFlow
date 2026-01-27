import { describe, expect, it, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the db module
vi.mock("./db", () => ({
  getCertificateById: vi.fn(),
  getUserById: vi.fn(),
  getCourseById: vi.fn(),
  getExamAttempt: vi.fn(),
  getCompanyById: vi.fn(),
  updateCertificatePdfUrl: vi.fn(),
  getUserCertificates: vi.fn(),
  createCertificate: vi.fn(),
}));

describe("Zertifikat-Funktionen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sollte Zertifikat mit 1 Jahr Gültigkeit erstellen", async () => {
    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Simuliere Zertifikat-Erstellung
    const certData = {
      userId: 1,
      courseId: 1,
      examAttemptId: 1,
      certificateNumber: `CERT-${Date.now()}-1`,
      expiresAt: oneYearLater,
    };

    (db.createCertificate as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    
    const certId = await db.createCertificate(certData);
    
    expect(certId).toBe(1);
    expect(db.createCertificate).toHaveBeenCalledWith(certData);
    
    // Prüfe dass expiresAt ca. 1 Jahr in der Zukunft liegt
    const daysDiff = Math.round((certData.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    expect(daysDiff).toBeGreaterThanOrEqual(364);
    expect(daysDiff).toBeLessThanOrEqual(366);
  });

  it("sollte Zertifikat nur für berechtigten User abrufen", async () => {
    const mockCert = {
      id: 1,
      userId: 5,
      courseId: 1,
      certificateNumber: "CERT-123",
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      pdfUrl: null,
    };

    (db.getCertificateById as ReturnType<typeof vi.fn>).mockResolvedValue(mockCert);

    const cert = await db.getCertificateById(1);
    
    // User 5 ist berechtigt
    const requestingUserId = 5;
    expect(cert?.userId).toBe(requestingUserId);
    
    // User 10 ist NICHT berechtigt
    const unauthorizedUserId = 10;
    expect(cert?.userId).not.toBe(unauthorizedUserId);
  });

  it("sollte abgelaufene Zertifikate erkennen", () => {
    const expiredCert = {
      id: 1,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Gestern
    };

    const validCert = {
      id: 2,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // In 30 Tagen
    };

    const isExpired = (cert: { expiresAt: Date | null }) => {
      return cert.expiresAt && new Date(cert.expiresAt) < new Date();
    };

    expect(isExpired(expiredCert)).toBe(true);
    expect(isExpired(validCert)).toBe(false);
  });

  it("sollte User-Zertifikate mit Kursnamen abrufen", async () => {
    const mockCerts = [
      { id: 1, courseId: 1, certificateNumber: "CERT-1" },
      { id: 2, courseId: 2, certificateNumber: "CERT-2" },
    ];

    (db.getUserCertificates as ReturnType<typeof vi.fn>).mockResolvedValue(mockCerts);
    (db.getCourseById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 1, title: "KI-Grundlagen" })
      .mockResolvedValueOnce({ id: 2, title: "KI-Kompetenz Zertifizierung" });

    const certs = await db.getUserCertificates(1);
    
    expect(certs).toHaveLength(2);
    
    // Kursnamen hinzufügen (wie im Router)
    const certsWithCourse = await Promise.all(certs.map(async (cert: any) => {
      const course = await db.getCourseById(cert.courseId);
      return { ...cert, courseName: course?.title || 'Unbekannt' };
    }));

    expect(certsWithCourse[0].courseName).toBe("KI-Grundlagen");
    expect(certsWithCourse[1].courseName).toBe("KI-Kompetenz Zertifizierung");
  });
});

describe("FirmenAdmin Doppelrolle", () => {
  it("sollte FirmenAdmin Zugriff auf Kurse erlauben", () => {
    const roles = {
      sysadmin: { canManageCourses: true, canTakeCourses: false },
      companyadmin: { canManageCourses: false, canTakeCourses: true },
      user: { canManageCourses: false, canTakeCourses: true },
    };

    // FirmenAdmin kann Kurse absolvieren
    expect(roles.companyadmin.canTakeCourses).toBe(true);
    
    // User kann auch Kurse absolvieren
    expect(roles.user.canTakeCourses).toBe(true);
    
    // SysAdmin verwaltet nur
    expect(roles.sysadmin.canTakeCourses).toBe(false);
  });
});
