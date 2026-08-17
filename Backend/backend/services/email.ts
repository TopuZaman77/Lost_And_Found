import { eq } from "drizzle-orm";
import { emailDeliveries } from "../../database/schema";
import { getDb } from "../db";

type EmailInput = {
  notificationId: number;
  recipient: string;
  subject: string;
  body: string;
};

export async function queueAndSendEmail(input: EmailInput) {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();
  const inserted = await db
    .insert(emailDeliveries)
    .values({
      ...input,
      status: "queued",
      createdAt: now,
    })
    .$returningId();
  const deliveryId = inserted[0]?.id;
  if (!deliveryId) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    await db
      .update(emailDeliveries)
      .set({
        status: "skipped",
        failureReason: "Email transport is not configured.",
      })
      .where(eq(emailDeliveries.id, deliveryId));
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.recipient], subject: input.subject, text: input.body }),
    });

    const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) throw new Error(payload.message || `Email provider returned ${response.status}`);

    await db
      .update(emailDeliveries)
      .set({ status: "sent", providerId: payload.id ?? null, sentAt: Date.now(), failureReason: null })
      .where(eq(emailDeliveries.id, deliveryId));
  } catch (error) {
    await db
      .update(emailDeliveries)
      .set({ status: "failed", failureReason: error instanceof Error ? error.message : "Unknown email error" })
      .where(eq(emailDeliveries.id, deliveryId));
  }
}
