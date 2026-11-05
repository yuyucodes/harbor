import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email().toLowerCase().refine((e) => e.endsWith(".edu"), "Use your .edu email"),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(2).max(40),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

// "12.50" -> 1250. Never use parseFloat for money (0.29 * 100 gives 28.999...).
export function parseDollarsToCents(input: string): number | null {
  const m = /^\s*\$?(\d{1,7})(?:\.(\d{1,2}))?\s*$/.exec(input);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

export const createListingSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(5000),
    categoryId: z.string().min(1),
    condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "FOR_PARTS"]),
    type: z.enum(["AUCTION", "BUY_NOW"]),
    startPriceCents: z.number().int().min(100).max(10_000_000).optional(),
    reservePriceCents: z.number().int().min(100).max(10_000_000).optional(),
    buyNowPriceCents: z.number().int().min(100).max(10_000_000).optional(),
    endsAt: z.coerce.date().optional(),
    deliveryMethod: z.enum(["PICKUP", "LOCAL_DELIVERY", "SHIPPED"]),
    deliveryFeeCents: z.number().int().min(0).max(100_000).default(0),
    deliveryNotes: z.string().trim().max(500).optional(),
  })
  .superRefine((v, ctx) => {
    const bad = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (v.type === "AUCTION") {
      if (v.startPriceCents == null) bad("startPriceCents", "Starting price is required");
      if (!v.endsAt) bad("endsAt", "End time is required");
      else {
        const ms = v.endsAt.getTime() - Date.now();
        if (ms < 60 * 60 * 1000 || ms > 14 * 24 * 60 * 60 * 1000) bad("endsAt", "Auctions run 1 hour to 14 days");
      }
      if (v.reservePriceCents != null && v.startPriceCents != null && v.reservePriceCents < v.startPriceCents)
        bad("reservePriceCents", "Reserve must be at least the starting price");
      if (v.buyNowPriceCents != null) bad("buyNowPriceCents", "Not allowed on auctions");
    } else {
      if (v.buyNowPriceCents == null) bad("buyNowPriceCents", "Price is required");
      if (v.startPriceCents != null || v.reservePriceCents != null || v.endsAt)
        bad("type", "Auction fields are not allowed on buy now listings");
    }
  });