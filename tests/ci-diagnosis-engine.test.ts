import { describe, it, expect } from "vitest";
import {
  diagnoseSession,
  isVisitorInHoldout,
  RULE_VERSION,
} from "@/customer-intelligence/lib/diagnosis-engine";
import { RawEvent, SessionRecord, SupplierHealthRecord } from "@/customer-intelligence/lib/types";

describe("Customer Intelligence Diagnosis Engine (Task 4 & Task 8)", () => {
  const baseSession: SessionRecord = {
    session_id: "ses_test_001",
    visitor_key: "visitor_12345",
    started_at: new Date(Date.now() - 3600000).toISOString(),
    ended_at: new Date().toISOString(),
    source: "google",
    device: "desktop",
    pages: 4,
    max_stage: "cart",
    cart_value: 1500,
    had_error: false,
    is_lost: true,
    is_recovered: false,
  };

  it("assigns deterministic 10% holdout based on visitor key hash", () => {
    // Check that holdout assignment is pure and consistent
    const h1 = isVisitorInHoldout("user_alpha_99");
    const h2 = isVisitorInHoldout("user_alpha_99");
    expect(h1).toBe(h2);
    expect(typeof h1).toBe("boolean");
  });

  it("Rule 1: diagnoses payment_fail or 500 error as technical_failure with high confidence", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "add_to_cart",
        product_id: "prod_paraffin_wax",
        page_path: "/products/paraffin-wax",
        device: "desktop",
      },
      {
        event_id: "evt_2",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "payment_fail",
        product_id: null,
        page_path: "/checkout",
        device: "desktop",
        props: { error_code: "GATEWAY_TIMEOUT", reason: "Bank server did not respond" },
      },
    ];

    const result = diagnoseSession(baseSession, events);
    expect(result.cause).toBe("technical_failure");
    expect(result.confidence).toBe("high");
    expect(result.evidence.some((e) => e.includes("GATEWAY_TIMEOUT"))).toBe(true);
  });

  it("Rule 2: diagnoses out of stock as supply_problem with high confidence", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "out_of_stock_view",
        product_id: "prod_diffuser_reed",
        page_path: "/products/reed-diffuser",
        device: "desktop",
        props: { product_name: "Reed Diffuser Sticks" },
      },
    ];

    const result = diagnoseSession(baseSession, events);
    expect(result.cause).toBe("supply_problem");
    expect(result.confidence).toBe("high");
  });

  it("Rule 2b: diagnoses flagged supplier as supply_problem with high confidence", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "add_to_cart",
        product_id: "prod_flagged_supplier_item",
        page_path: "/products/flagged",
        device: "desktop",
      },
    ];

    const supplierHealth: SupplierHealthRecord[] = [
      {
        seller_id: "seller_bad_dispatch",
        seller_name: "Seller Bad Dispatch",
        product_id: "prod_flagged_supplier_item",
        product_name: "Flagged Item",
        avg_dispatch_days: 7.5,
        cancel_rate: 0.15,
        stockout_days_30d: 5,
        is_flagged: true,
        has_coa_upload: false,
        has_photos: true,
        flag_reasons: ["SLA exceeded"],
        listing_completeness: 40,
        updated_at: new Date().toISOString(),
      },
    ];

    const result = diagnoseSession(baseSession, events, supplierHealth);
    expect(result.cause).toBe("supply_problem");
    expect(result.confidence).toBe("high");
  });

  it("Rule 3: diagnoses WhatsApp click as whatsapp_diverted", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "add_to_cart",
        product_id: "prod_soy_wax",
        page_path: "/products/soy-wax",
        device: "desktop",
      },
      {
        event_id: "evt_2",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "whatsapp_click",
        product_id: "prod_soy_wax",
        page_path: "/products/soy-wax",
        device: "desktop",
        props: { location: "pdp_quote" },
      },
    ];

    const result = diagnoseSession(baseSession, events);
    expect(result.cause).toBe("whatsapp_diverted");
    expect(result.confidence).toBe("high");
  });

  it("Rule 4: diagnoses GST abandonment as gst_block", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "begin_checkout",
        page_path: "/checkout",
        device: "desktop",
      },
      {
        event_id: "evt_2",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "gst_field_focus",
        page_path: "/checkout",
        device: "desktop",
      },
      {
        event_id: "evt_3",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "gst_field_abandon",
        page_path: "/checkout",
        device: "desktop",
      },
    ];

    const result = diagnoseSession(baseSession, events);
    expect(result.cause).toBe("gst_block");
    expect(result.confidence).toBe("medium");
  });

  it("Rule 5: diagnoses shipping threshold exit as shipping_shock", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "shipping_threshold_view",
        page_path: "/cart",
        device: "desktop",
        props: { cartValue: 1200, threshold: 2000 },
      },
    ];

    const result = diagnoseSession({ ...baseSession, cart_value: 1200 }, events);
    expect(result.cause).toBe("shipping_shock");
    expect(result.confidence).toBe("medium");
  });

  it("Rule 6: diagnoses 2+ tier pricing views as tier_confusion", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "tier_pricing_view",
        product_id: "prod_beeswax",
        page_path: "/products/beeswax",
        device: "desktop",
      },
      {
        event_id: "evt_2",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "tier_pricing_view",
        product_id: "prod_beeswax",
        page_path: "/products/beeswax",
        device: "desktop",
      },
    ];

    const result = diagnoseSession(baseSession, events);
    expect(result.cause).toBe("tier_confusion");
    expect(result.confidence).toBe("medium");
  });

  it("Rule 7: diagnoses 2+ COA certificate views as trust_hesitation", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "coa_click",
        product_id: "prod_essential_oil",
        page_path: "/products/essential-oil",
        device: "desktop",
      },
      {
        event_id: "evt_2",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "coa_click",
        product_id: "prod_essential_oil",
        page_path: "/products/essential-oil",
        device: "desktop",
      },
    ];

    const result = diagnoseSession(baseSession, events);
    expect(result.cause).toBe("trust_hesitation");
    expect(result.confidence).toBe("medium");
  });

  it("Rule 9: defaults to unknown cause when no specific signal matches", () => {
    const events: RawEvent[] = [
      {
        event_id: "evt_1",
        ts: new Date().toISOString(),
        anonymous_id: "anon_1",
        session_id: "ses_test_001",
        customer_id: null,
        event_name: "page_view",
        page_path: "/shop",
        device: "desktop",
      },
    ];

    const result = diagnoseSession(baseSession, events);
    expect(result.cause).toBe("unknown");
    expect(result.confidence).toBe("unknown");
  });
});
