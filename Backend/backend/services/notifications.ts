import { notifications } from "../../database/schema";
import { getDb } from "../db";
import { queueAndSendEmail } from "./email";

type NotificationType =
  | "item_match"
  | "claim_submitted"
  | "claim_approved"
  | "claim_rejected";

type NotificationInput = {
  userId: number;
  recipientEmail?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  itemId?: number | null;
  claimId?: number | null;
};

export async function dispatchNotification(input: NotificationInput) {
  const db = await getDb();
  if (!db) return;

  const inserted = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      itemId: input.itemId ?? null,
      claimId: input.claimId ?? null,
      isRead: false,
      createdAt: Date.now(),
    })
    .$returningId();

  const notificationId = inserted[0]?.id;
  if (notificationId && input.recipientEmail) {
    await queueAndSendEmail({
      notificationId,
      recipient: input.recipientEmail,
      subject: input.title,
      body: `${input.message}\n\nOpen DIU Lost & Found to review the details.`,
    });
  }

  return notificationId;
}
