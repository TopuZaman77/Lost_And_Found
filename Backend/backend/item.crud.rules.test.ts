import { describe, expect, it } from "vitest";
import { canDeleteItem, canEditItem } from "./services/rules";

const openReport = { reporterId: 10, reportType: "lost" as const, status: "Lost" as const };
const claimedReport = { ...openReport, status: "Claimed" as const };

describe("item CRUD ownership rules", () => {
  it("lets a reporter update and delete an open report", () => {
    const reporter = { id: 10, role: "user" as const };
    expect(canEditItem(openReport, reporter)).toBe(true);
    expect(canDeleteItem(openReport, reporter)).toBe(true);
  });

  it("blocks a reporter from changing a report with an active claim", () => {
    const reporter = { id: 10, role: "user" as const };
    expect(canEditItem(claimedReport, reporter)).toBe(false);
    expect(canDeleteItem(claimedReport, reporter)).toBe(false);
  });

  it("blocks unrelated users and permits staff administrators", () => {
    expect(canEditItem(openReport, { id: 99, role: "user" })).toBe(false);
    expect(canDeleteItem(openReport, { id: 99, role: "user" })).toBe(false);
    expect(canEditItem(claimedReport, { id: 5, role: "admin" })).toBe(true);
    expect(canDeleteItem(claimedReport, { id: 5, role: "admin" })).toBe(true);
  });
});
