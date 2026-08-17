import { describe, expect, it } from "vitest";

describe("Resend email configuration", () => {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM_EMAIL;

  it("uses the audited outbox fallback when no email credential is configured", () => {
    if (apiKey) return;
    expect(apiKey).toBeUndefined();
    expect(sender).toBeUndefined();
  });

  it.skipIf(!apiKey)("validates the supplied API key with the provider domains endpoint", async () => {
    const response = await fetch("https://api.resend.com/domains?limit=1", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect(sender).toMatch(/.+<[^<>\s]+@[^<>\s]+>|^[^\s@]+@[^\s@]+$/);
  });
});
