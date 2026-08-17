import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { manualLoginInput, manualRegistrationInput } from "../shared/manualAuth";
import { hashPassword, verifyPassword } from "./services/passwords";

describe("manual account validation", () => {
  it("normalizes Gmail addresses and student IDs for duplicate-safe registration", () => {
    const result = manualRegistrationInput.parse({
      name: "Toufiquzzaman Topu",
      studentId: "221-15-1234",
      email: "  TOFUQUIZZAMAN@GMAIL.COM ",
      password: "Campus123",
    });
    expect(result.email).toBe("tofuquizzaman@gmail.com");
    expect(result.studentId).toBe("221-15-1234");
  });

  it("rejects non-Gmail addresses and weak passwords", () => {
    expect(() => manualRegistrationInput.parse({ name: "Student Name", studentId: "221-15-1234", email: "student@diu.edu.bd", password: "Campus123" })).toThrow();
    expect(() => manualRegistrationInput.parse({ name: "Student Name", studentId: "221-15-1234", email: "student@gmail.com", password: "password" })).toThrow();
    expect(() => manualLoginInput.parse({ email: "student@example.com", password: "anything" })).toThrow();
  });
});

describe("manual account password protection", () => {
  it("stores a salted one-way hash and rejects an incorrect password", async () => {
    const password = "Campus123";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword123", hash)).toBe(false);
  });
});

describe("manual auth website copy", () => {
  it("keeps the requested manual fields and no provider attribution", () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, "../frontend/src/pages/AuthPage.tsx"), "utf8");
    expect(source).toContain("Full name");
    expect(source).toContain("Student ID");
    expect(source).toContain("Gmail address");
    expect(source).toContain("Confirm password");
    expect(source).not.toMatch(/Powered by Manus|Login with Manus|Google sign in/i);
  });
});
