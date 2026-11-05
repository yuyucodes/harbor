import type { FastifyInstance } from "fastify";
import { createListingSchema } from "@harbor/shared";
import { prisma } from "../../lib/prisma";
import { requireVerified } from "../../plugins/auth";

const tileSelect = {
  id: true, title: true, condition: true, type: true, status: true,
  currentPriceCents: true, bidCount: true, endsAt: true,
  deliveryMethod: true, deliveryFeeCents: true, createdAt: true,
} as const;

export async function listingRoutes(app: FastifyInstance) {
  app.get("/categories", async () => prisma.category.findMany({ orderBy: { name: "asc" } }));

  app.post("/listings", { preHandler: requireVerified }, async (req, reply) => {
    const parsed = createListingSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    const v = parsed.data;

    const category = await prisma.category.findUnique({ where: { id: v.categoryId } });
    if (!category) return reply.code(400).send({ error: { categoryId: ["Unknown category"] } });

    const listing = await prisma.listing.create({
      data: {
        sellerId: req.user!.id,
        categoryId: v.categoryId,
        title: v.title,
        description: v.description,
        condition: v.condition,
        type: v.type,
        startPriceCents: v.startPriceCents,
        reservePriceCents: v.reservePriceCents,
        buyNowPriceCents: v.buyNowPriceCents,
        endsAt: v.endsAt,
        currentPriceCents: v.type === "AUCTION" ? v.startPriceCents! : v.buyNowPriceCents!,
        deliveryMethod: v.deliveryMethod,
        deliveryFeeCents: v.deliveryFeeCents,
        deliveryNotes: v.deliveryNotes,
      },
    });
    return reply.code(201).send({ id: listing.id });
  });

  app.get("/listings", async (req) => {
    const { cursor, category } = req.query as { cursor?: string; category?: string };
    const items = await prisma.listing.findMany({
      where: { status: "ACTIVE", ...(category ? { category: { slug: category } } : {}) },
      select: tileSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 24,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return { items, nextCursor: items.length === 24 ? items[items.length - 1].id : null };
  });

  app.get("/listings/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const l = await prisma.listing.findUnique({
      where: { id },
      select: {
        ...tileSelect,
        description: true, deliveryNotes: true, startPriceCents: true, buyNowPriceCents: true,
        reservePriceCents: true,
        seller: { select: { id: true, displayName: true, school: true } },
        category: { select: { slug: true, name: true } },
      },
    });
    if (!l) return reply.code(404).send({ error: "Not found" });
    // Never expose the reserve amount, only whether one exists
    const { reservePriceCents, ...rest } = l;
    return { ...rest, hasReserve: reservePriceCents != null };
  });
}