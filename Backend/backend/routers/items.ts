import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  like,
  lte,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { claims, itemMatches, items, profiles, statusHistory, users } from "../../database/schema";
import { ITEM_CATEGORIES, ITEM_STATUSES } from "../../shared/lostFound";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { requireDb } from "../db";
import { calculateMatchScore, isLikelyMatch } from "../services/matching";
import { dispatchNotification } from "../services/notifications";
import { canDeleteItem, canEditItem } from "../services/rules";

const reportInput = z
  .object({
    reportType: z.enum(["lost", "found"]),
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(12).max(4_000),
    category: z.enum(ITEM_CATEGORIES),
    eventDate: z.number().int().positive(),
    location: z.string().trim().min(3).max(220),
    holdingLocation: z.string().trim().max(220).optional().nullable(),
    contactDetails: z.string().trim().min(4).max(320),
    imageKey: z.string().max(512).optional().nullable(),
    imageUrl: z.string().max(768).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.eventDate > Date.now() + 86_400_000) {
      ctx.addIssue({ code: "custom", path: ["eventDate"], message: "The event date cannot be in the future." });
    }
    if (value.reportType === "found" && !value.holdingLocation?.trim()) {
      ctx.addIssue({ code: "custom", path: ["holdingLocation"], message: "A holding location is required." });
    }
  });

function buildSearchText(title: string, description: string, location: string) {
  return `${title} ${description} ${location}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 512);
}

async function requireCompletedProfile(userId: number) {
  const db = await requireDb();
  const result = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!result[0]) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete your DIU profile before submitting a report." });
  }
}

async function detectMatches(itemId: number) {
  const db = await requireDb();
  const sourceRows = await db
    .select({ item: items, reporterEmail: users.email })
    .from(items)
    .innerJoin(users, eq(items.reporterId, users.id))
    .where(eq(items.id, itemId))
    .limit(1);
  const source = sourceRows[0];
  if (!source) return;
  const complementaryType = source.item.reportType === "found" ? "lost" : "found";

  const candidates = await db
    .select({ item: items, reporterEmail: users.email })
    .from(items)
    .innerJoin(users, eq(items.reporterId, users.id))
    .where(
      and(
        eq(items.reportType, complementaryType),
        eq(items.category, source.item.category),
        ne(items.status, "Returned"),
        ne(items.reporterId, source.item.reporterId),
      ),
    )
    .limit(50);

  for (const candidate of candidates) {
    const lost = source.item.reportType === "lost" ? source.item : candidate.item;
    const found = source.item.reportType === "found" ? source.item : candidate.item;
    if (!isLikelyMatch(lost, found)) continue;
    const existing = await db
      .select({ id: itemMatches.id })
      .from(itemMatches)
      .where(and(eq(itemMatches.lostItemId, lost.id), eq(itemMatches.foundItemId, found.id)))
      .limit(1);
    if (existing[0]) continue;

    const score = calculateMatchScore(lost, found);
    await db.insert(itemMatches).values({
      lostItemId: lost.id,
      foundItemId: found.id,
      matchScore: score,
      createdAt: Date.now(),
    });
    const lostReporterEmail = source.item.reportType === "lost" ? source.reporterEmail : candidate.reporterEmail;
    await dispatchNotification({
      userId: lost.reporterId,
      recipientEmail: lostReporterEmail,
      type: "item_match",
      title: "A possible match was found",
      message: `A found item may match “${lost.title}”. Review the details before submitting a claim.`,
      itemId: found.id,
    });
  }
}

export const itemsRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          search: z.string().trim().max(100).default(""),
          reportType: z.enum(["all", "lost", "found"]).default("all"),
          category: z.enum(["all", ...ITEM_CATEGORIES]).default("all"),
          status: z.enum(["all", ...ITEM_STATUSES]).default("all"),
          dateFrom: z.number().int().positive().optional(),
          dateTo: z.number().int().positive().optional(),
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(24).default(9),
          sort: z.enum(["newest", "oldest", "eventDate"]).default("newest"),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const filters = input ?? {
        search: "",
        reportType: "all" as const,
        category: "all" as const,
        status: "all" as const,
        page: 1,
        pageSize: 9,
        sort: "newest" as const,
      };
      const conditions: SQL[] = [];
      if (filters.search) {
        const normalized = filters.search.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
        const query = `%${normalized}%`;
        conditions.push(
          or(like(items.searchText, query), like(items.title, query), like(items.location, query))!,
        );
      }
      if (filters.reportType !== "all") conditions.push(eq(items.reportType, filters.reportType));
      if (filters.category !== "all") conditions.push(eq(items.category, filters.category));
      if (filters.status !== "all") conditions.push(eq(items.status, filters.status));
      if (filters.dateFrom) conditions.push(gte(items.eventDate, filters.dateFrom));
      if (filters.dateTo) conditions.push(lte(items.eventDate, filters.dateTo));
      const where = conditions.length ? and(...conditions) : undefined;
      const orderBy =
        filters.sort === "oldest"
          ? asc(items.createdAt)
          : filters.sort === "eventDate"
            ? desc(items.eventDate)
            : desc(items.createdAt);

      const [rows, totalRows] = await Promise.all([
        db
          .select({
            id: items.id,
            reporterId: items.reporterId,
            reporterName: users.name,
            reportType: items.reportType,
            title: items.title,
            description: items.description,
            category: items.category,
            eventDate: items.eventDate,
            location: items.location,
            holdingLocation: items.holdingLocation,
            contactDetails: items.contactDetails,
            imageUrl: items.imageUrl,
            status: items.status,
            createdAt: items.createdAt,
            updatedAt: items.updatedAt,
          })
          .from(items)
          .innerJoin(users, eq(items.reporterId, users.id))
          .where(where)
          .orderBy(orderBy)
          .limit(filters.pageSize)
          .offset((filters.page - 1) * filters.pageSize),
        db.select({ value: count() }).from(items).where(where),
      ]);
      const total = totalRows[0]?.value ?? 0;
      return {
        items: rows,
        total,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
      };
    }),

  detail: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const result = await db
      .select({ item: items, reporterName: users.name })
      .from(items)
      .innerJoin(users, eq(items.reporterId, users.id))
      .where(eq(items.id, input.id))
      .limit(1);
    if (!result[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Item report not found." });

    const history = await db
      .select()
      .from(statusHistory)
      .where(eq(statusHistory.itemId, input.id))
      .orderBy(asc(statusHistory.createdAt));
    const ownClaim = ctx.user
      ? (
          await db
            .select()
            .from(claims)
            .where(and(eq(claims.itemId, input.id), eq(claims.claimantId, ctx.user.id)))
            .limit(1)
        )[0] ?? null
      : null;
    return {
      ...result[0],
      history,
      ownClaim,
      canManage: Boolean(ctx.user && (ctx.user.id === result[0].item.reporterId || ctx.user.role === "admin")),
    };
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select().from(items).where(eq(items.reporterId, ctx.user.id)).orderBy(desc(items.createdAt));
  }),

  create: protectedProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
    await requireCompletedProfile(ctx.user.id);
    const db = await requireDb();
    const now = Date.now();
    const inserted = await db
      .insert(items)
      .values({
        reporterId: ctx.user.id,
        reportType: input.reportType,
        title: input.title,
        description: input.description,
        searchText: buildSearchText(input.title, input.description, input.location),
        category: input.category,
        eventDate: input.eventDate,
        location: input.location,
        holdingLocation: input.reportType === "found" ? input.holdingLocation : null,
        contactDetails: input.contactDetails,
        imageKey: input.imageKey ?? null,
        imageUrl: input.imageUrl ?? null,
        status: "Lost",
        createdAt: now,
        updatedAt: now,
      })
      .$returningId();
    const itemId = inserted[0]?.id;
    if (!itemId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create the report." });
    await db.insert(statusHistory).values({
      itemId,
      fromStatus: null,
      toStatus: "Lost",
      actorId: ctx.user.id,
      note: input.reportType === "lost" ? "Lost item report created." : "Found item report created.",
      createdAt: now,
    });
    await detectMatches(itemId);
    return { id: itemId };
  }),

  update: protectedProcedure
    .input(reportInput.omit({ reportType: true }).partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const existing = await db.select().from(items).where(eq(items.id, input.id)).limit(1);
      const item = existing[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item report not found." });
      if (!canEditItem(item, ctx.user)) {
        throw new TRPCError({
          code: item.reporterId === ctx.user.id ? "CONFLICT" : "FORBIDDEN",
          message: item.reporterId === ctx.user.id ? "Only open reports can be edited." : "You cannot edit this report.",
        });
      }
      const { id, ...changes } = input;
      const nextTitle = changes.title ?? item.title;
      const nextDescription = changes.description ?? item.description;
      const nextLocation = changes.location ?? item.location;
      await db
        .update(items)
        .set({
          ...changes,
          searchText: buildSearchText(nextTitle, nextDescription, nextLocation),
          updatedAt: Date.now(),
        })
        .where(eq(items.id, id));
      return { success: true } as const;
    }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const existing = await db.select().from(items).where(eq(items.id, input.id)).limit(1);
    const item = existing[0];
    if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item report not found." });
    if (!canDeleteItem(item, ctx.user)) {
      throw new TRPCError({
        code: item.reporterId === ctx.user.id ? "CONFLICT" : "FORBIDDEN",
        message:
          item.reporterId === ctx.user.id
            ? "A report with an active claim cannot be deleted."
            : "You cannot delete this report.",
      });
    }
    await db.delete(items).where(eq(items.id, input.id));
    return { success: true } as const;
  }),
});
