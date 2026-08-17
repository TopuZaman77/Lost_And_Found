import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const mediaRouter = router({
  uploadItemImage: protectedProcedure
    .input(
      z.object({
        fileName: z.string().trim().min(1).max(180),
        mimeType: z.enum(ALLOWED_MIME_TYPES),
        base64: z.string().min(8).max(7_500_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cleanBase64 = input.base64.includes(",") ? input.base64.split(",").pop() ?? "" : input.base64;
      const buffer = Buffer.from(cleanBase64, "base64");
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The image must be smaller than 5 MB." });
      }

      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const result = await storagePut(
        `lost-found/${ctx.user.id}/${Date.now()}-${safeFileName}`,
        buffer,
        input.mimeType,
      );
      return result;
    }),
});
