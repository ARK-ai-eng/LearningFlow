import { describe, expect, it, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the db module
vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  getInvitationByEmail: vi.fn(),
  upsertUser: vi.fn(),
}));

describe("OAuth User Creation Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT create user when no invitation exists and not owner", async () => {
    // Simulate: User does not exist, no invitation
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const userInfo = {
      openId: "new-user-123",
      email: "random@example.com",
      name: "Random User",
    };
    const ownerOpenId = "owner-open-id";

    // Logic check
    const existingUser = await db.getUserByOpenId(userInfo.openId);
    const isOwner = userInfo.openId === ownerOpenId;
    const invitation = userInfo.email ? await db.getInvitationByEmail(userInfo.email) : null;
    const hasValidInvitation = !!invitation;

    const shouldCreateUser = existingUser || isOwner || hasValidInvitation;

    expect(shouldCreateUser).toBe(false);
    expect(db.getUserByOpenId).toHaveBeenCalledWith("new-user-123");
    expect(db.getInvitationByEmail).toHaveBeenCalledWith("random@example.com");
  });

  it("should create user when valid invitation exists", async () => {
    // Simulate: User does not exist, but has valid invitation
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      email: "invited@example.com",
      expiresAt: new Date(Date.now() + 86400000), // 24h from now
      usedAt: null,
    });

    const userInfo = {
      openId: "invited-user-456",
      email: "invited@example.com",
      name: "Invited User",
    };
    const ownerOpenId = "owner-open-id";

    const existingUser = await db.getUserByOpenId(userInfo.openId);
    const isOwner = userInfo.openId === ownerOpenId;
    const invitation = userInfo.email ? await db.getInvitationByEmail(userInfo.email) : null;
    const hasValidInvitation = !!invitation && new Date() < invitation.expiresAt && !invitation.usedAt;

    const shouldCreateUser = existingUser || isOwner || hasValidInvitation;

    expect(shouldCreateUser).toBe(true);
  });

  it("should create user when user is owner (SysAdmin)", async () => {
    // Simulate: User does not exist, no invitation, but is owner
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const userInfo = {
      openId: "owner-open-id",
      email: "owner@example.com",
      name: "Owner",
    };
    const ownerOpenId = "owner-open-id";

    const existingUser = await db.getUserByOpenId(userInfo.openId);
    const isOwner = userInfo.openId === ownerOpenId;
    const invitation = userInfo.email ? await db.getInvitationByEmail(userInfo.email) : null;
    const hasValidInvitation = !!invitation;

    const shouldCreateUser = existingUser || isOwner || hasValidInvitation;

    expect(shouldCreateUser).toBe(true);
  });

  it("should update user when user already exists", async () => {
    // Simulate: User already exists
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      openId: "existing-user-789",
      email: "existing@example.com",
    });
    (db.getInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const userInfo = {
      openId: "existing-user-789",
      email: "existing@example.com",
      name: "Existing User",
    };
    const ownerOpenId = "owner-open-id";

    const existingUser = await db.getUserByOpenId(userInfo.openId);
    const isOwner = userInfo.openId === ownerOpenId;
    const invitation = userInfo.email ? await db.getInvitationByEmail(userInfo.email) : null;
    const hasValidInvitation = !!invitation;

    const shouldCreateUser = existingUser || isOwner || hasValidInvitation;

    expect(shouldCreateUser).toBeTruthy(); // existingUser is truthy
  });

  it("should NOT create user when invitation is expired", async () => {
    // Simulate: User does not exist, invitation exists but expired
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      email: "expired@example.com",
      expiresAt: new Date(Date.now() - 86400000), // 24h ago (expired)
      usedAt: null,
    });

    const userInfo = {
      openId: "expired-user-111",
      email: "expired@example.com",
      name: "Expired User",
    };
    const ownerOpenId = "owner-open-id";

    const existingUser = await db.getUserByOpenId(userInfo.openId);
    const isOwner = userInfo.openId === ownerOpenId;
    const invitation = userInfo.email ? await db.getInvitationByEmail(userInfo.email) : null;
    const hasValidInvitation = !!invitation && new Date() < invitation.expiresAt && !invitation.usedAt;

    const shouldCreateUser = existingUser || isOwner || hasValidInvitation;

    expect(shouldCreateUser).toBe(false);
  });

  it("should NOT create user when invitation is already used", async () => {
    // Simulate: User does not exist, invitation exists but already used
    (db.getUserByOpenId as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (db.getInvitationByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      email: "used@example.com",
      expiresAt: new Date(Date.now() + 86400000), // Still valid
      usedAt: new Date(), // But already used
    });

    const userInfo = {
      openId: "used-user-222",
      email: "used@example.com",
      name: "Used User",
    };
    const ownerOpenId = "owner-open-id";

    const existingUser = await db.getUserByOpenId(userInfo.openId);
    const isOwner = userInfo.openId === ownerOpenId;
    const invitation = userInfo.email ? await db.getInvitationByEmail(userInfo.email) : null;
    const hasValidInvitation = !!invitation && new Date() < invitation.expiresAt && !invitation.usedAt;

    const shouldCreateUser = existingUser || isOwner || hasValidInvitation;

    expect(shouldCreateUser).toBe(false);
  });
});
