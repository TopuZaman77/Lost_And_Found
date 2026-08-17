import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "../shared/const";
import { hashPassword } from "./services/passwords";

const mocks = vi.hoisted(() => ({
  requireDb: vi.fn(),
  createSessionToken: vi.fn(),
}));

vi.mock("./db", () => ({ requireDb: mocks.requireDb }));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: mocks.createSessionToken } }));

import { localAuthRouter } from "./routers/localAuth";

function chain(result: unknown) {
  const value = { from: vi.fn(), innerJoin: vi.fn(), where: vi.fn(), limit: vi.fn() };
  value.from.mockReturnValue(value);
  value.innerJoin.mockReturnValue(value);
  value.where.mockReturnValue(value);
  value.limit.mockResolvedValue(result);
  return value;
}

function context() {
  const cookie = vi.fn();
  return {
    ctx: { user: null, req: { protocol: "https", headers: {} }, res: { cookie } } as any,
    cookie,
  };
}

beforeEach(() => {
  mocks.requireDb.mockReset();
  mocks.createSessionToken.mockReset();
  mocks.createSessionToken.mockResolvedValue("manual-session-token");
});

describe("localAuth.register", () => {
  it("creates a hashed local credential and secure session cookie", async () => {
    const duplicateEmail = chain([]);
    const duplicateCredential = chain([]);
    const duplicateStudent = chain([]);
    const newUser = { id: 42, openId: "local_test", name: "Test Student", email: "test@gmail.com", loginMethod: "password" };
    const savedUser = chain([newUser]);
    const credentialValues = vi.fn().mockResolvedValue(undefined);
    const transaction = {
      insert: vi
        .fn()
        .mockReturnValueOnce({ values: vi.fn().mockReturnValue({ $returningId: vi.fn().mockResolvedValue([{ id: 42 }]) }) })
        .mockReturnValueOnce({ values: credentialValues }),
    };
    const db = { select: vi.fn().mockReturnValueOnce(duplicateEmail).mockReturnValueOnce(duplicateCredential).mockReturnValueOnce(duplicateStudent).mockReturnValueOnce(savedUser), transaction: vi.fn(async callback => callback(transaction)) };
    mocks.requireDb.mockResolvedValue(db);
    const { ctx, cookie } = context();

    const result = await localAuthRouter.createCaller(ctx).register({ name: "Test Student", studentId: "221-15-1234", email: "TEST@GMAIL.COM", password: "Campus123" });

    expect(result).toMatchObject({ success: true, requiresProfile: true, user: { id: 42, email: "test@gmail.com" } });
    expect(mocks.createSessionToken).toHaveBeenCalledWith("local_test", { name: "Test Student" });
    expect(cookie).toHaveBeenCalledWith(COOKIE_NAME, "manual-session-token", expect.objectContaining({ httpOnly: true, secure: true, sameSite: "none" }));
    const savedCredential = credentialValues.mock.calls[0][0];
    expect(savedCredential.passwordHash).not.toContain("Campus123");
    expect(savedCredential.email).toBe("test@gmail.com");
  });

  it("rejects duplicate Gmail or student-ID registration before creating a user", async () => {
    const db = { select: vi.fn().mockReturnValueOnce(chain([{ id: 7 }])).mockReturnValueOnce(chain([])).mockReturnValueOnce(chain([])), transaction: vi.fn() };
    mocks.requireDb.mockResolvedValue(db);
    const { ctx } = context();
    await expect(localAuthRouter.createCaller(ctx).register({ name: "Existing Student", studentId: "221-15-1234", email: "existing@gmail.com", password: "Campus123" })).rejects.toThrow("already exists");
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

describe("localAuth.login", () => {
  it("issues a secure session for a correct password and returns profile completion state", async () => {
    const passwordHash = await hashPassword("Campus123");
    const account = { credential: { passwordHash }, user: { id: 8, openId: "local_login", name: "Login Student", email: "login@gmail.com", loginMethod: "password" } };
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn().mockReturnValueOnce(chain([account])).mockReturnValueOnce(chain([])),
      update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: updateWhere }) }),
    };
    mocks.requireDb.mockResolvedValue(db);
    const { ctx, cookie } = context();
    const result = await localAuthRouter.createCaller(ctx).login({ email: "login@gmail.com", password: "Campus123" });
    expect(result).toMatchObject({ success: true, requiresProfile: true, user: { id: 8 } });
    expect(cookie).toHaveBeenCalledWith(COOKIE_NAME, "manual-session-token", expect.objectContaining({ httpOnly: true }));
  });

  it("rejects invalid credentials without issuing a session", async () => {
    const db = { select: vi.fn().mockReturnValue(chain([])) };
    mocks.requireDb.mockResolvedValue(db);
    const { ctx, cookie } = context();
    await expect(localAuthRouter.createCaller(ctx).login({ email: "missing@gmail.com", password: "Campus123" })).rejects.toThrow("Invalid Gmail address or password");
    expect(cookie).not.toHaveBeenCalled();
  });
});
