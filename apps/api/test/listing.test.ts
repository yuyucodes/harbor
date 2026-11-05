import { describe, it, expect } from "vitest";
import { parseDollarsToCents, createListingSchema } from "@harbor/shared";

describe("parseDollarsToCents", () => {
  it("parses dollars exactly", () => {
    expect(parseDollarsToCents("0.29")).toBe(29);
    expect(parseDollarsToCents("12")).toBe(1200);
    expect(parseDollarsToCents("$1.5")).toBe(150);
    expect(parseDollarsToCents("abc")).toBeNull();
  });
});

const base = {
  title: "Used keyboard", description: "Works great, minor wear.", categoryId: "x",
  condition: "GOOD", deliveryMethod: "PICKUP",
} as const;

describe("createListingSchema", () => {
  it("accepts a buy now listing", () => {
    expect(createListingSchema.safeParse({ ...base, type: "BUY_NOW", buyNowPriceCents: 2500 }).success).toBe(true);
  });
  it("rejects an auction with no end time", () => {
    expect(createListingSchema.safeParse({ ...base, type: "AUCTION", startPriceCents: 500 }).success).toBe(false);
  });
  it("rejects auction fields on buy now", () => {
    expect(createListingSchema.safeParse({ ...base, type: "BUY_NOW", buyNowPriceCents: 2500, startPriceCents: 500 }).success).toBe(false);
  });
});