import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isSafeInternalPath } from "../frontend/src/const";

const root = path.resolve(import.meta.dirname, "..");

describe("website authentication pages", () => {
  it("accepts only safe internal post-auth continuation paths", () => {
    expect(isSafeInternalPath("/profile")).toBe(true);
    expect(isSafeInternalPath("/report/lost")).toBe(true);
    expect(isSafeInternalPath("//malicious.example")).toBe(false);
    expect(isSafeInternalPath("https://malicious.example")).toBe(false);
    expect(isSafeInternalPath("profile")).toBe(false);
  });

  it("keeps dedicated login and registration routes in the website router", () => {
    const source = fs.readFileSync(path.join(root, "frontend/src/App.tsx"), "utf8");
    expect(source).toContain('<Route path="/login" component={LoginPage} />');
    expect(source).toContain('<Route path="/register" component={RegisterPage} />');
  });

  it("keeps explicit Login and Register links in signed-out website navigation", () => {
    const source = fs.readFileSync(path.join(root, "frontend/src/components/AppShell.tsx"), "utf8");
    expect(source).toContain('<Link href="/login">');
    expect(source).toContain('<Link href="/register">');
  });
});
