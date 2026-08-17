import { describe, expect, it } from "vitest";
import { canTransitionStatus, ITEM_STATUSES } from "../shared/lostFound";

describe("item status lifecycle", () => {
  it("keeps the exact required public labels in order", () => {
    expect(ITEM_STATUSES).toEqual(["Lost", "Claimed", "Verified", "Returned"]);
  });

  it("allows only the documented status transitions", () => {
    expect(canTransitionStatus("Lost", "Claimed")).toBe(true);
    expect(canTransitionStatus("Claimed", "Verified")).toBe(true);
    expect(canTransitionStatus("Claimed", "Lost")).toBe(true);
    expect(canTransitionStatus("Verified", "Returned")).toBe(true);
    expect(canTransitionStatus("Lost", "Returned")).toBe(false);
    expect(canTransitionStatus("Returned", "Lost")).toBe(false);
  });
});
