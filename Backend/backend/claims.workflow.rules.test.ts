import { describe, expect, it } from "vitest";
import { claimSubmissionIssue, statusAfterClaimReview, statusAfterClaimSubmission } from "./services/rules";

const foundItem = { reporterId: 10, reportType: "found" as const, status: "Lost" as const };

describe("claim workflow rules", () => {
  it("accepts a new claimant and advances Lost to Claimed", () => {
    expect(claimSubmissionIssue(foundItem, 11, false)).toBeNull();
    expect(statusAfterClaimSubmission("Lost")).toBe("Claimed");
  });

  it("prevents self claims, duplicate claims, and claims on lost-report records", () => {
    expect(claimSubmissionIssue(foundItem, 10, false)).toContain("cannot claim");
    expect(claimSubmissionIssue(foundItem, 11, true)).toContain("already submitted");
    expect(claimSubmissionIssue({ ...foundItem, reportType: "lost" }, 11, false)).toContain("found items");
  });

  it("closes verified or returned items to new claims", () => {
    expect(claimSubmissionIssue({ ...foundItem, status: "Verified" }, 11, false)).toContain("no longer accepting");
    expect(claimSubmissionIssue({ ...foundItem, status: "Returned" }, 11, false)).toContain("no longer accepting");
  });

  it("maps staff decisions to the correct public status", () => {
    expect(statusAfterClaimReview("Claimed", "approved", 0)).toBe("Verified");
    expect(statusAfterClaimReview("Claimed", "rejected", 0)).toBe("Lost");
    expect(statusAfterClaimReview("Claimed", "rejected", 2)).toBe("Claimed");
  });
});
