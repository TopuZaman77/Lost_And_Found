import type { ItemStatus } from "../../shared/lostFound";

type Actor = { id: number; role: "user" | "admin" };
type ManagedItem = {
  reporterId: number;
  reportType: "lost" | "found";
  status: ItemStatus;
};

export function canEditItem(item: ManagedItem, actor: Actor) {
  return actor.role === "admin" || (item.reporterId === actor.id && item.status === "Lost");
}

export function canDeleteItem(item: ManagedItem, actor: Actor) {
  return actor.role === "admin" || (item.reporterId === actor.id && item.status === "Lost");
}

export function claimSubmissionIssue(
  item: ManagedItem,
  claimantId: number,
  hasExistingClaim: boolean,
) {
  if (item.reportType !== "found") return "Ownership claims can only be submitted for found items.";
  if (item.reporterId === claimantId) return "You cannot claim an item that you reported.";
  if (item.status === "Verified" || item.status === "Returned") return "This item is no longer accepting ownership claims.";
  if (hasExistingClaim) return "You already submitted a claim for this item.";
  return null;
}

export function statusAfterClaimSubmission(status: ItemStatus): ItemStatus {
  return status === "Lost" ? "Claimed" : status;
}

export function statusAfterClaimReview(
  currentStatus: ItemStatus,
  decision: "approved" | "rejected",
  remainingPendingClaims: number,
): ItemStatus {
  if (decision === "approved") return "Verified";
  if (currentStatus === "Claimed" && remainingPendingClaims === 0) return "Lost";
  return currentStatus;
}
