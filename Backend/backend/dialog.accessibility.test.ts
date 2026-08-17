import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("dialog accessibility regression", () => {
  it("keeps an accessible title in the responsive website navigation sheet", () => {
    const source = fs.readFileSync(path.join(root, "frontend/src/components/AppShell.tsx"), "utf8");
    expect(source).toContain('<SheetTitle className="sr-only">Lost and Found website navigation</SheetTitle>');
    expect(source).toContain('<SheetDescription className="sr-only">Navigate the Lost and Found website, authentication pages, reports, profile, and notifications.</SheetDescription>');
  });
});
