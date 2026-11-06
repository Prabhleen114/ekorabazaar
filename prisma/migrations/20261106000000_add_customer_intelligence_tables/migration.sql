-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
ADD COLUMN IF NOT EXISTS "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'website';

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_events" (
    "event_id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "anonymous_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "event_name" TEXT NOT NULL,
    "product_id" TEXT,
    "page_path" TEXT,
    "device" TEXT,
    "utm" JSONB,
    "props" JSONB,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "is_synthetic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ci_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_identity_links" (
    "anonymous_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_identity_links_pkey" PRIMARY KEY ("anonymous_id","customer_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_sessions" (
    "session_id" TEXT NOT NULL,
    "visitor_key" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "device" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 0,
    "max_stage" TEXT,
    "cart_value" DECIMAL(12,2),
    "had_error" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "is_recovered" BOOLEAN,

    CONSTRAINT "ci_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_customer_features" (
    "visitor_key" TEXT NOT NULL,
    "sessions_30d" INTEGER NOT NULL DEFAULT 0,
    "product_views_30d" INTEGER NOT NULL DEFAULT 0,
    "carts_30d" INTEGER NOT NULL DEFAULT 0,
    "checkouts_30d" INTEGER NOT NULL DEFAULT 0,
    "orders_total" INTEGER NOT NULL DEFAULT 0,
    "last_order_at" TIMESTAMP(3),
    "avg_order_value" DECIMAL(12,2),
    "coa_clicks_30d" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_clicks_30d" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_customer_features_pkey" PRIMARY KEY ("visitor_key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_product_daily" (
    "day" DATE NOT NULL,
    "product_id" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "carts" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "units_sold" INTEGER NOT NULL DEFAULT 0,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "no_result_searches" INTEGER NOT NULL DEFAULT 0,
    "oos_views" INTEGER NOT NULL DEFAULT 0,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ci_product_daily_pkey" PRIMARY KEY ("day","product_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_session_diagnosis" (
    "session_id" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "rule_version" TEXT NOT NULL,
    "diagnosed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "handled_at" TIMESTAMP(3),
    "handled_by" TEXT,

    CONSTRAINT "ci_session_diagnosis_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_actions" (
    "action_id" BIGSERIAL NOT NULL,
    "visitor_key" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "in_holdout" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled_by" TEXT,
    "handled_at" TIMESTAMP(3),

    CONSTRAINT "ci_actions_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_outcomes" (
    "action_id" BIGINT NOT NULL,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "order_value" DECIMAL(12,2),
    "gross_margin" DECIMAL(12,2),
    "window_end" TIMESTAMP(3),

    CONSTRAINT "ci_outcomes_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ci_supplier_health" (
    "seller_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "avg_dispatch_days" DECIMAL(6,2) NOT NULL,
    "cancel_rate" DECIMAL(6,4) NOT NULL,
    "stockout_days_30d" INTEGER NOT NULL,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "has_coa_doc" BOOLEAN NOT NULL DEFAULT false,
    "listing_score" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ci_supplier_health_pkey" PRIMARY KEY ("seller_id","product_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ci_events_session_id_ts_idx" ON "ci_events"("session_id", "ts");
CREATE INDEX IF NOT EXISTS "ci_events_event_name_ts_idx" ON "ci_events"("event_name", "ts");
CREATE INDEX IF NOT EXISTS "ci_events_anonymous_id_ts_idx" ON "ci_events"("anonymous_id", "ts");
CREATE INDEX IF NOT EXISTS "ci_identity_links_customer_id_idx" ON "ci_identity_links"("customer_id");
CREATE INDEX IF NOT EXISTS "ci_sessions_visitor_key_started_at_idx" ON "ci_sessions"("visitor_key", "started_at");
CREATE INDEX IF NOT EXISTS "ci_sessions_is_lost_started_at_idx" ON "ci_sessions"("is_lost", "started_at");
CREATE INDEX IF NOT EXISTS "ci_product_daily_product_id_day_idx" ON "ci_product_daily"("product_id", "day");
CREATE INDEX IF NOT EXISTS "ci_session_diagnosis_cause_diagnosed_at_idx" ON "ci_session_diagnosis"("cause", "diagnosed_at");
CREATE INDEX IF NOT EXISTS "ci_session_diagnosis_handled_diagnosed_at_idx" ON "ci_session_diagnosis"("handled", "diagnosed_at");
CREATE INDEX IF NOT EXISTS "ci_actions_visitor_key_created_at_idx" ON "ci_actions"("visitor_key", "created_at");
CREATE INDEX IF NOT EXISTS "ci_actions_status_created_at_idx" ON "ci_actions"("status", "created_at");
CREATE INDEX IF NOT EXISTS "ci_supplier_health_is_flagged_idx" ON "ci_supplier_health"("is_flagged");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ci_session_diagnosis_session_id_fkey') THEN
        ALTER TABLE "ci_session_diagnosis" ADD CONSTRAINT "ci_session_diagnosis_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ci_sessions"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ci_outcomes_action_id_fkey') THEN
        ALTER TABLE "ci_outcomes" ADD CONSTRAINT "ci_outcomes_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "ci_actions"("action_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
