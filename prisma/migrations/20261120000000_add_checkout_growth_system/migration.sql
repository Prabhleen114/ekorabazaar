-- 3.1 Config-driven tiers
CREATE TABLE IF NOT EXISTS checkout_tiers (
  id               SERIAL PRIMARY KEY,
  campaign         TEXT NOT NULL DEFAULT 'default',
  min_subtotal     NUMERIC(12,2) NOT NULL CHECK (min_subtotal >= 0),
  discount_percent NUMERIC(5,2)  NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  max_discount     NUMERIC(12,2),
  gift_sku         TEXT,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from       TIMESTAMPTZ,
  valid_to         TIMESTAMPTZ
);

-- Seed with confirmed owner decisions:
-- Gift starts at ₹5,000, 5% discount, max_discount = 500, GIFT_A
-- ₹10,000: 7% discount, max_discount = 500, GIFT_B
INSERT INTO checkout_tiers (campaign, min_subtotal, discount_percent, max_discount, gift_sku, active)
SELECT 'default', 5000.00, 5.00, 500.00, 'GIFT_A', true
WHERE NOT EXISTS (SELECT 1 FROM checkout_tiers WHERE campaign = 'default' AND min_subtotal = 5000.00);

INSERT INTO checkout_tiers (campaign, min_subtotal, discount_percent, max_discount, gift_sku, active)
SELECT 'default', 10000.00, 7.00, 500.00, 'GIFT_B', true
WHERE NOT EXISTS (SELECT 1 FROM checkout_tiers WHERE campaign = 'default' AND min_subtotal = 10000.00);

-- 3.2 Generic runtime config (key/value, cached)
CREATE TABLE IF NOT EXISTS checkout_config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial configs
INSERT INTO checkout_config (key, value)
VALUES 
  ('coupon_stacks_with_tier', 'false'::jsonb),
  ('points_earn_rate', '0.01'::jsonb),
  ('points_redeem_cap_pct', '0.25'::jsonb),
  ('points_min_redeem', '100'::jsonb),
  ('points_expiry_months', '6'::jsonb),
  ('points_release_days', '7'::jsonb),
  ('gift_requires_prepaid', 'true'::jsonb),
  ('tiers_enabled', 'true'::jsonb),
  ('progress_bar_enabled', 'true'::jsonb),
  ('recs_enabled', 'true'::jsonb),
  ('points_earn_enabled', 'true'::jsonb),
  ('points_redeem_enabled', 'true'::jsonb),
  ('gift_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3.3 Ekora wallet ledger: immutable rows, balance is derived
CREATE TABLE IF NOT EXISTS ekora_points_ledger (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  order_id        TEXT,
  type            TEXT NOT NULL CHECK (type IN ('earn','redeem','expire','reverse_earn','restore','admin_adjust')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','available','void')),
  points          INT  NOT NULL,
  remaining       INT,
  issued_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  note            TEXT,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      TEXT
);
CREATE INDEX IF NOT EXISTS ekora_ledger_spendable_idx
  ON ekora_points_ledger (user_id, expires_at)
  WHERE status = 'available' AND remaining > 0;
CREATE INDEX IF NOT EXISTS ekora_ledger_user_idx ON ekora_points_ledger (user_id, created_at DESC);

-- 3.4 Which earn rows a redemption consumed
CREATE TABLE IF NOT EXISTS ekora_redemption_allocations (
  id            BIGSERIAL PRIMARY KEY,
  redeem_row_id BIGINT NOT NULL REFERENCES ekora_points_ledger(id),
  earn_row_id   BIGINT NOT NULL REFERENCES ekora_points_ledger(id),
  points        INT NOT NULL CHECK (points > 0)
);

-- 3.5 Gift claims (abuse control)
CREATE TABLE IF NOT EXISTS gift_claims (
  id                  BIGSERIAL PRIMARY KEY,
  campaign            TEXT NOT NULL,
  user_id             TEXT,
  phone_hash          TEXT,
  address_hash        TEXT,
  payment_fingerprint TEXT,
  order_id            TEXT NOT NULL,
  gift_sku            TEXT NOT NULL,
  gift_mrp            NUMERIC(12,2) NOT NULL,
  status              TEXT NOT NULL DEFAULT 'claimed'
                      CHECK (status IN ('claimed','shipped','voided','clawed_back')),
  claimed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS gift_claim_phone_uq   ON gift_claims (campaign, phone_hash)   WHERE status <> 'voided' AND phone_hash   IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS gift_claim_address_uq ON gift_claims (campaign, address_hash) WHERE status <> 'voided' AND address_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS gift_claim_payment_idx ON gift_claims (campaign, payment_fingerprint) WHERE status <> 'voided';

-- 3.6 Per-order record of what the engine applied
CREATE TABLE IF NOT EXISTS order_adjustments (
  id            BIGSERIAL PRIMARY KEY,
  order_id      TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('tier_discount','gift','coupon','points','clawback')),
  tier_id       INT,
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  gift_sku      TEXT,
  points_used   INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_adjustments_order_idx ON order_adjustments (order_id);

-- 3.7 Extend Order / OrderItem / Product
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "eligibleSubtotal"  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS "tierId"            INT,
  ADD COLUMN IF NOT EXISTS "tierDiscount"      NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pointsRedeemed"    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pointsDiscount"    NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "experimentVariant" TEXT,
  ADD COLUMN IF NOT EXISTS "pricingSnapshot"   JSONB;

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "isGift" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "excludedFromTiers" BOOLEAN NOT NULL DEFAULT FALSE;

-- 3.8 Apriori / FP-Growth output
CREATE TABLE IF NOT EXISTS rec_rules (
  id            BIGSERIAL PRIMARY KEY,
  model_version TEXT NOT NULL,
  antecedent    TEXT[] NOT NULL,
  consequent    TEXT NOT NULL,
  support       NUMERIC(8,6) NOT NULL,
  confidence    NUMERIC(8,6) NOT NULL,
  lift          NUMERIC(10,4) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rec_rules_antecedent_gin ON rec_rules USING GIN (antecedent);
CREATE INDEX IF NOT EXISTS rec_rules_version_idx ON rec_rules (model_version);

CREATE TABLE IF NOT EXISTS rec_model_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_version TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO rec_model_state (id, active_version) VALUES (1, 'v1_initial') ON CONFLICT DO NOTHING;

-- 3.9 Checkout event checkpoints
CREATE TABLE IF NOT EXISTS checkout_events (
  id         BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  user_id    TEXT,
  cart_id    TEXT,
  order_id   TEXT,
  variant    TEXT,
  event      TEXT NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkout_events_event_time_idx ON checkout_events (event, created_at);
CREATE INDEX IF NOT EXISTS checkout_events_session_idx    ON checkout_events (session_id, created_at);
