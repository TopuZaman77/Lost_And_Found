import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ getDb: vi.fn() }));
vi.mock("./email", () => ({ queueAndSendEmail: vi.fn() }));

import { getDb } from "../db";
import { queueAndSendEmail } from "./email";
import { dispatchNotification } from "./notifications";

const getDbMock = vi.mocked(getDb);
const emailMock = vi.mocked(queueAndSendEmail);

describe("notification dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    "item_match",
    "claim_submitted",
    "claim_approved",
    "claim_rejected",
  ] as const)("persists and emails the %s trigger", async type => {
    const returningId = vi.fn().mockResolvedValue([{ id: 44 }]);
    const values = vi.fn().mockReturnValue({ $returningId: returningId });
    const insert = vi.fn().mockReturnValue({ values });
    getDbMock.mockResolvedValue({ insert } as never);

    await dispatchNotification({
      userId: 8,
      recipientEmail: "member@diu.edu.bd",
      type,
      title: "Status update",
      message: "A verified campus recovery event occurred.",
      itemId: 2,
      claimId: 3,
    });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 8, type, itemId: 2, claimId: 3, isRead: false }));
    expect(emailMock).toHaveBeenCalledWith(expect.objectContaining({ notificationId: 44, recipient: "member@diu.edu.bd" }));
  });
});

