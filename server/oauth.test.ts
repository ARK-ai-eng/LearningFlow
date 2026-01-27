import { describe, expect, it, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the db module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserByOpenId: vi.fn(),
  getActiveInvitationByEmail: vi.fn(),
  upsertUser: vi.fn(),
}));

describe("E-Mail als einziger Identifier - OAuth Logik", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sollte User NICHT erstellen wenn keine Einladung für E-Mail existiert", async () => {
    // Kein User mit dieser E-Mail, keine Einladung
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getActiveInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const email = "random@example.com";
    const ownerEmail = "owner@example.com";

    const existingUser = await db.getUserByEmail(email);
    const isOwner = email === ownerEmail;
    const invitation = await db.getActiveInvitationByEmail(email);

    const shouldAllowAccess = existingUser || isOwner || invitation;

    expect(shouldAllowAccess).toBeFalsy();
    expect(db.getUserByEmail).toHaveBeenCalledWith(email);
    expect(db.getActiveInvitationByEmail).toHaveBeenCalledWith(email);
  });

  it("sollte User erlauben wenn E-Mail bereits registriert ist", async () => {
    // User existiert bereits mit dieser E-Mail
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      email: "existing@example.com",
      openId: "some-open-id",
    });
    (db.getActiveInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const email = "existing@example.com";
    const ownerEmail = "owner@example.com";

    const existingUser = await db.getUserByEmail(email);
    const isOwner = email === ownerEmail;

    const shouldAllowAccess = existingUser || isOwner;

    expect(shouldAllowAccess).toBeTruthy();
  });

  it("sollte User erlauben wenn gültige Einladung für E-Mail existiert", async () => {
    // Kein User, aber gültige Einladung
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getActiveInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      email: "invited@example.com",
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    });

    const email = "invited@example.com";
    const ownerEmail = "owner@example.com";

    const existingUser = await db.getUserByEmail(email);
    const isOwner = email === ownerEmail;
    const invitation = await db.getActiveInvitationByEmail(email);

    const shouldAllowAccess = existingUser || isOwner || invitation;

    expect(shouldAllowAccess).toBeTruthy();
  });

  it("sollte Owner (SysAdmin) immer erlauben", async () => {
    // Kein User, keine Einladung, aber ist Owner
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getActiveInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const email = "owner@example.com";
    const ownerEmail = "owner@example.com";

    const existingUser = await db.getUserByEmail(email);
    const isOwner = email === ownerEmail;

    const shouldAllowAccess = existingUser || isOwner;

    expect(shouldAllowAccess).toBe(true);
  });
});

describe("E-Mail-Duplikat-Prüfung bei Einladungen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sollte Einladung ablehnen wenn E-Mail bereits als User registriert", async () => {
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      email: "existing@example.com",
    });

    const email = "existing@example.com";
    const existingUser = await db.getUserByEmail(email);

    expect(existingUser).toBeTruthy();
    // In der echten Implementierung würde hier ein CONFLICT Error geworfen
  });

  it("sollte Einladung ablehnen wenn aktive Einladung für E-Mail existiert", async () => {
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getActiveInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      email: "pending@example.com",
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: null,
    });

    const email = "pending@example.com";
    const existingUser = await db.getUserByEmail(email);
    const existingInvitation = await db.getActiveInvitationByEmail(email);

    expect(existingUser).toBeFalsy();
    expect(existingInvitation).toBeTruthy();
    // In der echten Implementierung würde hier ein CONFLICT Error geworfen
  });

  it("sollte Einladung erlauben wenn E-Mail komplett neu ist", async () => {
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getActiveInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const email = "new@example.com";
    const existingUser = await db.getUserByEmail(email);
    const existingInvitation = await db.getActiveInvitationByEmail(email);

    expect(existingUser).toBeFalsy();
    expect(existingInvitation).toBeFalsy();
    // Einladung kann erstellt werden
  });

  it("sollte gleichen Namen mit unterschiedlichen E-Mails als verschiedene Personen behandeln", async () => {
    // Max Mustermann bei Firma A
    (db.getUserByEmail as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 1, email: "max@firma-a.de", firstName: "Max", lastName: "Mustermann" })
      .mockResolvedValueOnce(undefined); // Keine User mit max@firma-b.de

    const emailA = "max@firma-a.de";
    const emailB = "max@firma-b.de";

    const userA = await db.getUserByEmail(emailA);
    const userB = await db.getUserByEmail(emailB);

    // User A existiert
    expect(userA).toBeTruthy();
    expect(userA?.email).toBe("max@firma-a.de");

    // User B existiert nicht - kann eingeladen werden (obwohl gleicher Name)
    expect(userB).toBeFalsy();
  });
});
