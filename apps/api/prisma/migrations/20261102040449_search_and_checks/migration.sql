CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Listing_search_idx" ON "Listing"
  USING GIN (to_tsvector('english', "title" || ' ' || "description"));

ALTER TABLE "Listing" ADD CONSTRAINT listing_prices_nonneg CHECK (
  "currentPriceCents" >= 0 AND "deliveryFeeCents" >= 0
  AND coalesce("startPriceCents",0) >= 0 AND coalesce("buyNowPriceCents",0) >= 0);
ALTER TABLE "Bid" ADD CONSTRAINT bid_amount_positive CHECK ("amountCents" > 0);

CREATE UNIQUE INDEX "Order_listingId_live_key" ON "Order"("listingId")
  WHERE "status" <> 'CANCELLED';
ALTER TABLE "Report" ADD CONSTRAINT report_has_target CHECK (
  "listingId" IS NOT NULL OR "reportedUserId" IS NOT NULL);