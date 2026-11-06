import {
  ActionRecord,
  CauseCode,
  IdentityLink,
  ProductDemandDaily,
  RawEvent,
  SearchSynonym,
  SessionDiagnosis,
  SessionRecord,
  StandingFlag,
  SupplierHealthRecord,
} from "./types";
import {
  CAUSE_METADATA,
  diagnoseSession,
  evaluateStandingFlags,
  isVisitorInHoldout,
} from "./diagnosis-engine";

// In-Memory Database store adhering to the 10 tables in the End-to-End plan
class CustomerIntelligenceStore {
  public rawEvents: RawEvent[] = [];
  public identityLinks: IdentityLink[] = [];
  public sessions: SessionRecord[] = [];
  public diagnoses: SessionDiagnosis[] = [];
  public standingFlags: StandingFlag[] = [];
  public actions: ActionRecord[] = [];
  public supplierHealth: SupplierHealthRecord[] = [];
  public productDemand: ProductDemandDaily[] = [];
  public searchSynonyms: SearchSynonym[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date();
    const daysAgo = (d: number, h = 0) =>
      new Date(now.getTime() - (d * 24 * 60 + h * 60) * 60 * 1000).toISOString();

    // 1. Search Synonyms
    this.searchSynonyms = [
      { id: "syn_1", raw_term: "soya wax", canonical_term: "soy wax", notes: "common spelling variation" },
      { id: "syn_2", raw_term: "lavender oil", canonical_term: "lavender essential oil", notes: "essential vs fragrance" },
      { id: "syn_3", raw_term: "wax flakes", canonical_term: "soy wax 464", notes: "form factor synonym" },
      { id: "syn_4", raw_term: "pillar molds", canonical_term: "silicone candle mould", notes: "plural and spelling" },
      { id: "syn_5", raw_term: "bees wax", canonical_term: "beeswax pellets", notes: "spacing variation" },
    ];

    // 2. Supplier Health Table (page 7 & 10 of plan)
    this.supplierHealth = [
      {
        seller_id: "sup_naturo_aroma",
        seller_name: "NaturoAroma Organics (Kannauj, UP)",
        product_id: "prod_lavender_oil",
        product_name: "French Lavender Essential Oil (IFRA Grade)",
        avg_dispatch_days: 2.1,
        cancel_rate: 0.02,
        stockout_days_30d: 0,
        listing_completeness: 95,
        has_coa_upload: true,
        has_photos: true,
        is_flagged: false,
        flag_reasons: [],
        updated_at: daysAgo(0, 4),
      },
      {
        seller_id: "sup_purewax_chem",
        seller_name: "PureWax Chemical Corp (Ankleshwar, GJ)",
        product_id: "prod_soy_464",
        product_name: "Soy Wax Soya 464 (Pure Golden Wax Flakes)",
        avg_dispatch_days: 6.8, // FLAG: > 5 days
        cancel_rate: 0.14, // FLAG: > 10%
        stockout_days_30d: 5, // FLAG: >= 3 days
        listing_completeness: 82,
        has_coa_upload: true,
        has_photos: true,
        is_flagged: true,
        flag_reasons: [
          "Dispatch time 6.8 days (SLA max 5.0 days)",
          "Order cancel rate 14.0% (threshold 10.0%)",
          "5 stock-out days in past 30 days",
        ],
        updated_at: daysAgo(0, 3),
      },
      {
        seller_id: "sup_silicone_crafts",
        seller_name: "Precision Silicone Moulds (Surat, GJ)",
        product_id: "prod_pillar_mould",
        product_name: "Geometric Pillar Silicone Candle Mould",
        avg_dispatch_days: 1.8,
        cancel_rate: 0.03,
        stockout_days_30d: 0,
        listing_completeness: 70, // thin description
        has_coa_upload: false,
        has_photos: true,
        is_flagged: false,
        flag_reasons: [],
        updated_at: daysAgo(0, 6),
      },
      {
        seller_id: "sup_glass_pack",
        seller_name: "Firozabad Glass Industries (Firozabad, UP)",
        product_id: "prod_amber_jars",
        product_name: "Amber Glass Candle Jars 200ml (Set of 12)",
        avg_dispatch_days: 5.4, // FLAG: > 5 days
        cancel_rate: 0.08,
        stockout_days_30d: 4, // FLAG: >= 3 days
        listing_completeness: 88,
        has_coa_upload: true,
        has_photos: true,
        is_flagged: true,
        flag_reasons: ["Dispatch time 5.4 days exceeds 5 days", "4 stock-out days in past 30 days"],
        updated_at: daysAgo(0, 5),
      },
    ];

    // 3. Product Daily Demand Records (for Demand Reports on page 9)
    this.productDemand = [
      {
        day: daysAgo(0).split("T")[0],
        product_id: "prod_soy_464",
        product_name: "Soy Wax Soya 464 (Pure Golden Wax Flakes)",
        category: "Candle Waxes",
        price_inr: 450,
        stock_count: 0, // Out of stock!
        views: 342,
        carts: 89,
        purchases: 18,
        units_sold: 240,
        searches: 215,
        no_result_searches: 0,
        oos_views: 68,
        requests: 24,
        whatsapp_clicks: 19,
        top_diagnosis_cause: "supply_problem",
      },
      {
        day: daysAgo(0).split("T")[0],
        product_id: "prod_lavender_oil",
        product_name: "French Lavender Essential Oil (IFRA Grade)",
        category: "Fragrance Oils",
        price_inr: 680,
        stock_count: 145,
        views: 290,
        carts: 64,
        purchases: 32,
        units_sold: 84,
        searches: 178,
        no_result_searches: 0,
        oos_views: 0,
        requests: 4,
        whatsapp_clicks: 31, // High WhatsApp inquiry
        top_diagnosis_cause: "trust_hesitation",
      },
      {
        day: daysAgo(0).split("T")[0],
        product_id: "prod_vanilla_oil",
        product_name: "Madagascar Vanilla Fragrance Oil (Pure Grade)",
        category: "Fragrance Oils",
        price_inr: 720,
        stock_count: 90,
        views: 260,
        carts: 58,
        purchases: 28,
        units_sold: 62,
        searches: 142,
        no_result_searches: 0,
        oos_views: 0,
        requests: 2,
        whatsapp_clicks: 22,
        top_diagnosis_cause: "tier_confusion",
      },
      {
        day: daysAgo(0).split("T")[0],
        product_id: "prod_wicks_50",
        product_name: "Cotton Core Braided Candle Wicks (Pack of 50)",
        category: "Wicks & Accessories",
        price_inr: 220,
        stock_count: 310,
        views: 180,
        carts: 75,
        purchases: 45,
        units_sold: 120,
        searches: 95,
        no_result_searches: 0,
        oos_views: 0,
        requests: 0,
        whatsapp_clicks: 5,
        top_diagnosis_cause: "shipping_shock",
      },
      {
        day: daysAgo(0).split("T")[0],
        product_id: "prod_amber_jars",
        product_name: "Amber Glass Candle Jars 200ml (Set of 12)",
        category: "Glassware & Containers",
        price_inr: 850,
        stock_count: 0, // Out of stock
        views: 195,
        carts: 52,
        purchases: 8,
        units_sold: 24,
        searches: 110,
        no_result_searches: 0,
        oos_views: 42,
        requests: 18,
        whatsapp_clicks: 14,
        top_diagnosis_cause: "supply_problem",
      },
      {
        day: daysAgo(0).split("T")[0],
        product_id: "prod_pillar_mould",
        product_name: "Geometric Pillar Silicone Candle Mould",
        category: "Moulds & Tools",
        price_inr: 490,
        stock_count: 55,
        views: 160,
        carts: 38,
        purchases: 21,
        units_sold: 35,
        searches: 85,
        no_result_searches: 0,
        oos_views: 0,
        requests: 1,
        whatsapp_clicks: 8,
        top_diagnosis_cause: "tier_confusion",
      },
    ];

    // 4. Raw Events & Sessions with realistic Ekora Wholesale flows
    this.seedSessionsAndEvents();

    // 5. Build Initial Diagnoses
    this.rebuildDiagnoses();

    // 6. Build Actions & Holdout
    this.rebuildActions();

    // 7. Standing Flags
    this.rebuildStandingFlags();
  }

  private seedSessionsAndEvents() {
    const daysAgo = (d: number, h = 0, m = 0) =>
      new Date(Date.now() - (d * 24 * 3600 + h * 3600 + m * 60) * 1000).toISOString();

    // Session 1: Technical Failure (Payment Gateway timeout on ₹18,400 order)
    this.sessions.push({
      session_id: "sess_tech_101",
      visitor_key: "cust_vikram_singhania",
      started_at: daysAgo(0, 5),
      ended_at: daysAgo(0, 4),
      source: "google_search",
      device: "desktop",
      pages: 6,
      max_stage: "checkout",
      cart_value: 18400,
      had_error: true,
      is_lost: true,
    });
    this.rawEvents.push(
      {
        event_id: "evt_tech_1",
        ts: daysAgo(0, 5),
        anonymous_id: "anon_vikram_01",
        session_id: "sess_tech_101",
        customer_id: "cust_vikram_singhania",
        event_name: "page_view",
        page_path: "/products/soy-wax-464",
        device: "desktop",
      },
      {
        event_id: "evt_tech_2",
        ts: daysAgo(0, 4, 45),
        anonymous_id: "anon_vikram_01",
        session_id: "sess_tech_101",
        customer_id: "cust_vikram_singhania",
        event_name: "add_to_cart",
        product_id: "prod_soy_464",
        page_path: "/products/soy-wax-464",
        device: "desktop",
      },
      {
        event_id: "evt_tech_3",
        ts: daysAgo(0, 4, 30),
        anonymous_id: "anon_vikram_01",
        session_id: "sess_tech_101",
        customer_id: "cust_vikram_singhania",
        event_name: "begin_checkout",
        page_path: "/checkout",
        device: "desktop",
      },
      {
        event_id: "evt_tech_4",
        ts: daysAgo(0, 4, 15),
        anonymous_id: "anon_vikram_01",
        session_id: "sess_tech_101",
        customer_id: "cust_vikram_singhania",
        event_name: "payment_fail",
        page_path: "/checkout/payment",
        props: { error_code: "GATEWAY_TIMEOUT_HDFC_PG", amount: 18400 },
        device: "desktop",
      }
    );

    // Session 2: Supply Problem (Out of stock Soy Wax 464 + delayed supplier)
    this.sessions.push({
      session_id: "sess_supply_202",
      visitor_key: "cust_ananya_sharma",
      started_at: daysAgo(0, 12),
      ended_at: daysAgo(0, 11),
      source: "direct",
      device: "mobile",
      pages: 4,
      max_stage: "cart",
      cart_value: 12500,
      had_error: false,
      is_lost: true,
    });
    this.rawEvents.push(
      {
        event_id: "evt_sup_1",
        ts: daysAgo(0, 12),
        anonymous_id: "anon_ananya_01",
        session_id: "sess_supply_202",
        customer_id: "cust_ananya_sharma",
        event_name: "view_item",
        product_id: "prod_soy_464",
        page_path: "/products/soy-wax-464",
        device: "mobile",
      },
      {
        event_id: "evt_sup_2",
        ts: daysAgo(0, 11, 40),
        anonymous_id: "anon_ananya_01",
        session_id: "sess_supply_202",
        customer_id: "cust_ananya_sharma",
        event_name: "out_of_stock_view",
        product_id: "prod_soy_464",
        props: { product_name: "Soy Wax Soya 464", stock_level: 0 },
        page_path: "/products/soy-wax-464",
        device: "mobile",
      }
    );

    // Session 3: WhatsApp Diverted
    this.sessions.push({
      session_id: "sess_wa_303",
      visitor_key: "cust_tanvi_deshmukh",
      started_at: daysAgo(0, 18),
      ended_at: daysAgo(0, 17),
      source: "instagram",
      device: "mobile",
      pages: 5,
      max_stage: "cart",
      cart_value: 8200,
      had_error: false,
      is_lost: false, // Team following up, not treated as lost!
    });
    this.rawEvents.push({
      event_id: "evt_wa_1",
      ts: daysAgo(0, 17, 30),
      anonymous_id: "anon_tanvi_01",
      session_id: "sess_wa_303",
      customer_id: "cust_tanvi_deshmukh",
      event_name: "whatsapp_click",
      product_id: "prod_lavender_oil",
      page_path: "/products/lavender-oil",
      props: {
        inferred_intent: "bulk_fragrance_quotation",
        time_on_page_seconds: 145,
        page_location: "sticky_bottom_bar",
      },
      device: "mobile",
    });

    // Session 4: GST Block (Entered checkout, touched GST field, exited)
    this.sessions.push({
      session_id: "sess_gst_404",
      visitor_key: "cust_priya_patel",
      started_at: daysAgo(1, 4),
      ended_at: daysAgo(1, 3),
      source: "whatsapp_referral",
      device: "desktop",
      pages: 4,
      max_stage: "checkout",
      cart_value: 9400,
      had_error: false,
      is_lost: true,
    });
    this.rawEvents.push(
      {
        event_id: "evt_gst_1",
        ts: daysAgo(1, 3, 50),
        anonymous_id: "anon_priya_01",
        session_id: "sess_gst_404",
        customer_id: "cust_priya_patel",
        event_name: "begin_checkout",
        page_path: "/checkout",
        device: "desktop",
      },
      {
        event_id: "evt_gst_2",
        ts: daysAgo(1, 3, 30),
        anonymous_id: "anon_priya_01",
        session_id: "sess_gst_404",
        customer_id: "cust_priya_patel",
        event_name: "gst_field_focus",
        page_path: "/checkout/billing",
        device: "desktop",
      },
      {
        event_id: "evt_gst_3",
        ts: daysAgo(1, 3, 10),
        anonymous_id: "anon_priya_01",
        session_id: "sess_gst_404",
        customer_id: "cust_priya_patel",
        event_name: "gst_field_abandon",
        page_path: "/checkout/billing",
        device: "desktop",
      }
    );

    // Session 5: Shipping Shock (Cart ₹1,780, only ₹220 short of ₹2,000 free shipping)
    this.sessions.push({
      session_id: "sess_ship_505",
      visitor_key: "anon_visitor_jaipur_92",
      started_at: daysAgo(1, 8),
      ended_at: daysAgo(1, 7),
      source: "google_ads",
      device: "mobile",
      pages: 5,
      max_stage: "cart",
      cart_value: 1780,
      had_error: false,
      is_lost: true,
    });
    this.rawEvents.push(
      {
        event_id: "evt_ship_1",
        ts: daysAgo(1, 7, 40),
        anonymous_id: "anon_visitor_jaipur_92",
        session_id: "sess_ship_505",
        event_name: "add_to_cart",
        product_id: "prod_vanilla_oil",
        props: { cart_total: 1780 },
        device: "mobile",
      },
      {
        event_id: "evt_ship_2",
        ts: daysAgo(1, 7, 20),
        anonymous_id: "anon_visitor_jaipur_92",
        session_id: "sess_ship_505",
        event_name: "shipping_threshold_view",
        props: { amount_to_free_shipping: 220, threshold: 2000, cart_total: 1780 },
        device: "mobile",
      }
    );

    // Session 6: Tier Confusion (2+ tier_pricing_view, qty steppers shifting)
    this.sessions.push({
      session_id: "sess_tier_606",
      visitor_key: "cust_neha_kapoor",
      started_at: daysAgo(2, 2),
      ended_at: daysAgo(2, 1),
      source: "google_search",
      device: "desktop",
      pages: 7,
      max_stage: "cart",
      cart_value: 6400,
      had_error: false,
      is_lost: true,
    });
    this.rawEvents.push(
      {
        event_id: "evt_tier_1",
        ts: daysAgo(2, 1, 50),
        anonymous_id: "anon_neha_01",
        session_id: "sess_tier_606",
        customer_id: "cust_neha_kapoor",
        event_name: "tier_pricing_view",
        product_id: "prod_soy_464",
        props: { slab: "12-51 units" },
        device: "desktop",
      },
      {
        event_id: "evt_tier_2",
        ts: daysAgo(2, 1, 35),
        anonymous_id: "anon_neha_01",
        session_id: "sess_tier_606",
        customer_id: "cust_neha_kapoor",
        event_name: "quantity_change",
        product_id: "prod_soy_464",
        props: { old_qty: 6, new_qty: 15 },
        device: "desktop",
      },
      {
        event_id: "evt_tier_3",
        ts: daysAgo(2, 1, 20),
        anonymous_id: "anon_neha_01",
        session_id: "sess_tier_606",
        customer_id: "cust_neha_kapoor",
        event_name: "tier_pricing_view",
        product_id: "prod_soy_464",
        props: { slab: "52+ bulk units" },
        device: "desktop",
      }
    );

    // Session 7: Trust Hesitation (COA report opened twice, then exited)
    this.sessions.push({
      session_id: "sess_trust_707",
      visitor_key: "cust_rohit_mehra",
      started_at: daysAgo(2, 8),
      ended_at: daysAgo(2, 7),
      source: "linkedin",
      device: "desktop",
      pages: 6,
      max_stage: "view",
      cart_value: 0,
      had_error: false,
      is_lost: false, // browse-only
    });
    this.rawEvents.push(
      {
        event_id: "evt_trust_1",
        ts: daysAgo(2, 7, 45),
        anonymous_id: "anon_rohit_01",
        session_id: "sess_trust_707",
        customer_id: "cust_rohit_mehra",
        event_name: "coa_click",
        product_id: "prod_lavender_oil",
        props: { doc_type: "IFRA_Cert_2026.pdf" },
        device: "desktop",
      },
      {
        event_id: "evt_trust_2",
        ts: daysAgo(2, 7, 15),
        anonymous_id: "anon_rohit_01",
        session_id: "sess_trust_707",
        customer_id: "cust_rohit_mehra",
        event_name: "coa_click",
        product_id: "prod_lavender_oil",
        props: { doc_type: "COA_Batch_P9912.pdf" },
        device: "desktop",
      }
    );

    // Identity links
    this.identityLinks.push(
      { anonymous_id: "anon_vikram_01", customer_id: "cust_vikram_singhania", linked_at: daysAgo(10) },
      { anonymous_id: "anon_ananya_01", customer_id: "cust_ananya_sharma", linked_at: daysAgo(18) },
      { anonymous_id: "anon_tanvi_01", customer_id: "cust_tanvi_deshmukh", linked_at: daysAgo(5) },
      { anonymous_id: "anon_priya_01", customer_id: "cust_priya_patel", linked_at: daysAgo(12) },
      { anonymous_id: "anon_neha_01", customer_id: "cust_neha_kapoor", linked_at: daysAgo(25) },
      { anonymous_id: "anon_rohit_01", customer_id: "cust_rohit_mehra", linked_at: daysAgo(30) }
    );
  }

  public rebuildDiagnoses() {
    this.diagnoses = [];
    const customerDirectory: Record<string, { name: string; phone: string; email: string }> = {
      cust_vikram_singhania: { name: "Vikram Singhania", phone: "+91 94140 22314", email: "vikram.aroma@gmail.com" },
      cust_ananya_sharma: { name: "Ananya Sharma", phone: "+91 98201 44552", email: "ananya.candleworks@gmail.com" },
      cust_tanvi_deshmukh: { name: "Tanvi Deshmukh", phone: "+91 99490 88219", email: "tanvi.scents@gmail.com" },
      cust_priya_patel: { name: "Priya Patel", phone: "+91 98980 55432", email: "priya.organics@gmail.com" },
      cust_neha_kapoor: { name: "Neha Kapoor", phone: "+91 99802 77119", email: "neha.botanicals@outlook.com" },
      cust_rohit_mehra: { name: "Rohit Mehra", phone: "+91 98103 88129", email: "rohit.crafts.delhi@gmail.com" },
    };

    for (const session of this.sessions) {
      const diag = diagnoseSession(session, this.rawEvents, this.supplierHealth);
      const cust = customerDirectory[session.visitor_key];
      if (cust) {
        diag.customer_name = cust.name;
        diag.customer_phone = cust.phone;
        diag.customer_email = cust.email;
      }
      this.diagnoses.push(diag);
    }
  }

  public rebuildActions() {
    this.actions = [];
    let idCounter = 1001;

    for (const diag of this.diagnoses) {
      if (diag.cause === "unknown") continue; // Page 12: No action is valid recommendation for unknown
      const inHoldout = isVisitorInHoldout(diag.visitor_key);

      this.actions.push({
        action_id: idCounter++,
        visitor_key: diag.visitor_key,
        customer_name: diag.customer_name || "Guest Visitor",
        customer_phone: diag.customer_phone,
        cause: diag.cause,
        action_type: diag.suggested_action,
        in_holdout: inHoldout,
        status: inHoldout ? "skipped" : "suggested",
        created_at: diag.diagnosed_at,
        handled_by: null,
        handled_at: null,
        outcome_purchased: inHoldout ? false : Math.random() > 0.45,
        outcome_value: diag.cart_value > 0 ? diag.cart_value : 3500,
        outcome_margin: 0.32,
      });
    }

    // Seed additional historic actions for the Holdout / Results comparison tab
    // To demonstrate treated vs holdout attribution
    const historicCauses: CauseCode[] = [
      "shipping_shock",
      "tier_confusion",
      "trust_hesitation",
      "technical_failure",
      "gst_block",
    ];

    for (let i = 1; i <= 140; i++) {
      const isHoldout = i % 10 === 0;
      const cause = historicCauses[i % historicCauses.length];
      const purchased = isHoldout ? i % 4 === 0 : i % 2 === 0 || i % 3 === 0; // treated conversion is higher
      const val = 1200 + (i * 137) % 8000;

      this.actions.push({
        action_id: idCounter++,
        visitor_key: `hist_visitor_${i}`,
        customer_name: `Historic Customer ${i}`,
        cause,
        action_type: CAUSE_METADATA[cause].defaultAction,
        in_holdout: isHoldout,
        status: isHoldout ? "skipped" : "done",
        created_at: new Date(Date.now() - (i % 25) * 86400000).toISOString(),
        handled_by: isHoldout ? null : "Team Ekora",
        handled_at: isHoldout ? null : new Date(Date.now() - (i % 25) * 86400000).toISOString(),
        outcome_purchased: purchased,
        outcome_value: purchased ? val : 0,
        outcome_margin: 0.32,
      });
    }
  }

  public rebuildStandingFlags() {
    this.standingFlags = [];
    const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

    // Siddharth: 4 completed orders, average gap 24 days, last order was 42 days ago -> REORDER DUE
    const sidOrders = [
      { id: "ord_s1", total: 1450000, createdAt: daysAgo(42) },
      { id: "ord_s2", total: 1200000, createdAt: daysAgo(68) },
      { id: "ord_s3", total: 1100000, createdAt: daysAgo(94) },
      { id: "ord_s4", total: 1550000, createdAt: daysAgo(118) },
    ];
    this.standingFlags.push(
      ...evaluateStandingFlags(
        "cust_siddharth_verma",
        sidOrders,
        "Siddharth Verma",
        "+91 97654 32190",
        "siddharth.studio@gmail.com"
      )
    );

    // Rajesh Gupta: High value wholesale buyer (₹84,000 spend) with no orders in 48 days -> HIGH VALUE AT RISK
    const rajeshOrders = [
      { id: "ord_r1", total: 2800000, createdAt: daysAgo(48) },
      { id: "ord_r2", total: 3100000, createdAt: daysAgo(85) },
      { id: "ord_r3", total: 2500000, createdAt: daysAgo(120) },
    ];
    this.standingFlags.push(
      ...evaluateStandingFlags(
        "cust_rajesh_gupta",
        rajeshOrders,
        "Rajesh Gupta",
        "+91 98250 33441",
        "rajesh.traders@yahoo.com"
      )
    );

    // Pooja: 2 completed orders -> shows as LOW CONFIDENCE and not acted on (page 12: 'two points do not make a cycle')
    const poojaOrders = [
      { id: "ord_p1", total: 840000, createdAt: daysAgo(35) },
      { id: "ord_p2", total: 920000, createdAt: daysAgo(58) },
    ];
    this.standingFlags.push(
      ...evaluateStandingFlags(
        "cust_pooja_hegde",
        poojaOrders,
        "Pooja Hegde",
        "+91 94440 99881",
        "pooja.handmade@gmail.com"
      )
    );
  }

  // -------------------------------------------------------------------------
  // Page 1: Today Dashboard Data
  // -------------------------------------------------------------------------
  public getTodayDashboard() {
    const lostSessions = this.diagnoses.filter(
      (d) => d.cause !== "unknown" && d.cause !== "whatsapp_diverted"
    );

    const totalLostRupees = lostSessions.reduce((sum, d) => sum + d.cart_value, 0);

    // Rank causes strictly by RUPEES lost, not just counts! (page 8: 'Read the result in rupees, not counts')
    const causeRupeeMap: Record<CauseCode, { rupees: number; count: number }> = {
      technical_failure: { rupees: 0, count: 0 },
      supply_problem: { rupees: 0, count: 0 },
      whatsapp_diverted: { rupees: 0, count: 0 },
      gst_block: { rupees: 0, count: 0 },
      shipping_shock: { rupees: 0, count: 0 },
      tier_confusion: { rupees: 0, count: 0 },
      trust_hesitation: { rupees: 0, count: 0 },
      price_concern: { rupees: 0, count: 0 },
      unknown: { rupees: 0, count: 0 },
    };

    for (const d of this.diagnoses) {
      causeRupeeMap[d.cause].rupees += d.cart_value;
      causeRupeeMap[d.cause].count += 1;
    }

    const rankedCauses = Object.entries(causeRupeeMap)
      .map(([cause, data]) => ({
        cause: cause as CauseCode,
        meta: CAUSE_METADATA[cause as CauseCode],
        lostRupees: data.rupees,
        sessionCount: data.count,
      }))
      .filter((c) => c.sessionCount > 0)
      .sort((a, b) => b.lostRupees - a.lostRupees);

    const errorsSeen = this.rawEvents.filter(
      (e) => e.event_name === "payment_fail" || e.event_name === "api_error"
    ).length;

    const actionsWaiting = this.actions.filter((a) => a.status === "suggested").length;

    return {
      cartValueLost24h: totalLostRupees,
      cartValueLost7d: totalLostRupees * 2.8,
      rankedCauses,
      errorsSeen,
      actionsWaiting,
      totalSessionsCount: this.sessions.length,
      standingFlagsCount: this.standingFlags.length,
    };
  }

  // -------------------------------------------------------------------------
  // Page 2: Lost Sessions Table
  // -------------------------------------------------------------------------
  public getLostSessions(filterCause?: string, search?: string) {
    let list = [...this.diagnoses];

    if (filterCause && filterCause !== "all") {
      list = list.filter((d) => d.cause === filterCause);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.visitor_key.toLowerCase().includes(q) ||
          (d.customer_name && d.customer_name.toLowerCase().includes(q)) ||
          d.evidence.some((e) => e.toLowerCase().includes(q))
      );
    }

    // Sort by cart value lost descending
    list.sort((a, b) => b.cart_value - a.cart_value);
    return list;
  }

  public markSessionHandled(sessionId: string, handledBy = "Admin") {
    const diag = this.diagnoses.find((d) => d.session_id === sessionId);
    if (diag) {
      diag.handled = true;
      diag.handled_at = new Date().toISOString();
      diag.handled_by = handledBy;
    }
    return diag;
  }

  // -------------------------------------------------------------------------
  // Page 3: Conversion Funnel (page 11 of plan)
  // -------------------------------------------------------------------------
  public getFunnelData() {
    const visits = 1420;
    const productViews = 980;
    const carts = 340;
    const checkouts = 160;
    const purchases = 104;

    return {
      stages: [
        { stage: "visit", label: "Site Visitors", count: visits, dropPct: 0 },
        {
          stage: "view",
          label: "Product PDP Views",
          count: productViews,
          dropPct: Math.round(((visits - productViews) / visits) * 100),
          dropCount: visits - productViews,
          leakDiagnosis: "Search zero-results or quick bounce",
        },
        {
          stage: "cart",
          label: "Added to Cart",
          count: carts,
          dropPct: Math.round(((productViews - carts) / productViews) * 100),
          dropCount: productViews - carts,
          leakDiagnosis: "Tier slab confusion & COA hesitation",
        },
        {
          stage: "checkout",
          label: "Initiated Checkout",
          count: checkouts,
          dropPct: Math.round(((carts - checkouts) / carts) * 100),
          dropCount: carts - checkouts,
          leakDiagnosis: "Shipping threshold shock (< ₹2,000)",
        },
        {
          stage: "purchase",
          label: "Confirmed Orders",
          count: purchases,
          dropPct: Math.round(((checkouts - purchases) / checkouts) * 100),
          dropCount: checkouts - purchases,
          leakDiagnosis: "GST billing confusion & payment gateway timeout",
        },
      ],
      deviceSplit: {
        mobile: { visits: 920, carts: 195, purchases: 58 },
        desktop: { visits: 440, carts: 130, purchases: 42 },
        tablet: { visits: 60, carts: 15, purchases: 4 },
      },
      sourceSplit: [
        { source: "Google Organic", visits: 610, conversionRate: "8.2%" },
        { source: "Direct / WhatsApp", visits: 380, conversionRate: "11.4%" },
        { source: "Google Search Ads", visits: 290, conversionRate: "4.8%" },
        { source: "Instagram / Social", visits: 140, conversionRate: "3.5%" },
      ],
    };
  }

  // -------------------------------------------------------------------------
  // Page 4: Demand Reports (the 9 ranked lists from page 9 of plan)
  // -------------------------------------------------------------------------
  public getDemandReports() {
    const products = [...this.productDemand];

    // 1. Most viewed
    const mostViewed = [...products].sort((a, b) => b.views - a.views);

    // 2. Most carted
    const mostCarted = [...products].sort((a, b) => b.carts - a.carts);

    // 3. Best sellers
    const bestSellers = [...products].sort(
      (a, b) => b.purchases * b.price_inr - a.purchases * a.price_inr
    );

    // 4. Leaky products (High views/carts, low purchase rate; shows top diagnosis cause)
    const leakyProducts = [...products]
      .map((p) => {
        const cartToPurchaseRate = p.carts > 0 ? (p.purchases / p.carts) * 100 : 0;
        return {
          ...p,
          cartToPurchaseRate: Math.round(cartToPurchaseRate),
        };
      })
      .filter((p) => p.carts >= 25 && p.cartToPurchaseRate < 45)
      .sort((a, b) => a.cartToPurchaseRate - b.cartToPurchaseRate);

    // 5. Rising (Views vs prior daily average)
    const rising = [
      { product_name: "Candelilla Vegan Plant Wax", surgePct: "+84%", category: "Candle Waxes", currentViews: 145 },
      { product_name: "Rosemary & Mint Fragrance Oil", surgePct: "+62%", category: "Fragrance Oils", currentViews: 188 },
      { product_name: "Wooden Candle Wicks with Metal Clips", surgePct: "+45%", category: "Wicks", currentViews: 130 },
    ];

    // 6. Top searches (normalised text by unique visitors)
    const topSearches = [
      { query: "soy wax 464 flakes", uniqueVisitors: 215, hasResults: true },
      { query: "lavender essential oil ifra", uniqueVisitors: 178, hasResults: true },
      { query: "vanilla fragrance oil pure", uniqueVisitors: 142, hasResults: true },
      { query: "amber glass jars 200ml", uniqueVisitors: 110, hasResults: true },
      { query: "candle wicks cotton 50 pack", uniqueVisitors: 95, hasResults: true },
    ];

    // 7. Unmet demand (zero result searches and item requests)
    const unmetDemand = [
      {
        requestedPhrase: "rapeseed wax / canola wax",
        type: "search_no_results",
        uniqueVisitors: 48,
        actionAdvice: "High vegan market interest — source from Ankleshwar refinery",
      },
      {
        requestedPhrase: "electric wax melter 5L capacity",
        type: "item_request",
        uniqueVisitors: 36,
        actionAdvice: "Craft makers upgrading equipment — evaluate hardware supplier",
      },
      {
        requestedPhrase: "sandalwood mysore fragrance oil 500ml",
        type: "search_no_results",
        uniqueVisitors: 29,
        actionAdvice: "Premium fragrance category gap — request IFRA batch from Kannauj",
      },
      {
        requestedPhrase: "holographic holographic candle jars",
        type: "item_request",
        uniqueVisitors: 18,
        actionAdvice: "Festival packaging demand — connect with Firozabad glass sellers",
      },
    ];

    // 8. Out-of-stock losses (OOS views * cart rate * AOV in ₹)
    const aov = 2800;
    const cartRate = 0.24;
    const outOfStockLosses = products
      .filter((p) => p.oos_views > 0)
      .map((p) => {
        const estimatedLossRupees = Math.round(p.oos_views * cartRate * aov);
        return {
          product_name: p.product_name,
          oos_views: p.oos_views,
          requestsCount: p.requests,
          estimatedLossRupees,
        };
      })
      .sort((a, b) => b.estimatedLossRupees - a.estimatedLossRupees);

    // 9. Ask-on-WhatsApp (whatsapp_click by product page and location)
    const askOnWhatsApp = products
      .filter((p) => p.whatsapp_clicks > 0)
      .map((p) => ({
        product_name: p.product_name,
        whatsapp_clicks: p.whatsapp_clicks,
        commonPageLocation: p.category === "Fragrance Oils" ? "COA / Lab Specs Tab" : "Tier Quantity Stepper",
      }))
      .sort((a, b) => b.whatsapp_clicks - a.whatsapp_clicks);

    return {
      mostViewed,
      mostCarted,
      bestSellers,
      leakyProducts,
      rising,
      topSearches,
      unmetDemand,
      outOfStockLosses,
      askOnWhatsApp,
      synonyms: this.searchSynonyms,
    };
  }

  // -------------------------------------------------------------------------
  // Page 5: Customers & Standing Flags (page 11-12 of plan)
  // -------------------------------------------------------------------------
  public getCustomersProfiles() {
    return [
      {
        customer_id: "cust_siddharth_verma",
        name: "Siddharth Verma",
        phone: "+91 97654 32190",
        email: "siddharth.studio@gmail.com",
        city: "Pune",
        state: "Maharashtra",
        totalOrders: 4,
        lifetimeSpendRupees: 53500,
        averageOrderIntervalDays: 24,
        daysSinceLastOrder: 42,
        standingFlag: "reorder_due",
        flagConfidence: "high",
        suggestedAction: "WhatsApp reminder with 1-tap reorder link for Soy Wax 464",
        recentTimeline: [
          { time: "42 days ago", event: "Delivered Order #ORD-8812 (₹14,500)" },
          { time: "68 days ago", event: "Delivered Order #ORD-7910 (₹12,000)" },
          { time: "94 days ago", event: "Delivered Order #ORD-6821 (₹11,000)" },
        ],
      },
      {
        customer_id: "cust_rajesh_gupta",
        name: "Rajesh Gupta",
        phone: "+91 98250 33441",
        email: "rajesh.traders@yahoo.com",
        city: "Surat",
        state: "Gujarat",
        totalOrders: 3,
        lifetimeSpendRupees: 84000,
        averageOrderIntervalDays: 36,
        daysSinceLastOrder: 48,
        standingFlag: "high_value_at_risk",
        flagConfidence: "high",
        suggestedAction: "Priority call from senior key account manager (not template message)",
        recentTimeline: [
          { time: "48 days ago", event: "Order #ORD-9110 (₹28,000)" },
          { time: "85 days ago", event: "Order #ORD-8201 (₹31,000)" },
          { time: "120 days ago", event: "Order #ORD-7190 (₹25,000)" },
        ],
      },
      {
        customer_id: "cust_ananya_sharma",
        name: "Ananya Sharma",
        phone: "+91 98201 44552",
        email: "ananya.candleworks@gmail.com",
        city: "Mumbai",
        state: "Maharashtra",
        totalOrders: 0,
        lifetimeSpendRupees: 0,
        averageOrderIntervalDays: null,
        daysSinceLastOrder: null,
        standingFlag: "supply_problem",
        flagConfidence: "high",
        suggestedAction: "Offer in-stock alternative wax or notify upon batch dispatch",
        recentTimeline: [
          { time: "12 hours ago", event: "Encountered zero-stock page on Soy Wax 464" },
          { time: "14 hours ago", event: "Viewed French Lavender Essential Oil PDP" },
        ],
      },
      {
        customer_id: "cust_vikram_singhania",
        name: "Vikram Singhania",
        phone: "+91 94140 22314",
        email: "vikram.aroma@gmail.com",
        city: "Jaipur",
        state: "Rajasthan",
        totalOrders: 1,
        lifetimeSpendRupees: 16200,
        averageOrderIntervalDays: null,
        daysSinceLastOrder: 14,
        standingFlag: "technical_failure",
        flagConfidence: "high",
        suggestedAction: "Send apology and 1-click retry payment link via WhatsApp",
        recentTimeline: [
          { time: "4 hours ago", event: "Payment Gateway Failure (HDFC_PG) for ₹18,400" },
          { time: "14 days ago", event: "Completed Order #ORD-9410 (₹16,200)" },
        ],
      },
    ];
  }

  // -------------------------------------------------------------------------
  // Page 6: Supplier Health & Onboarding Funnel (page 10 of plan)
  // -------------------------------------------------------------------------
  public getSupplierData() {
    return {
      supplierHealth: this.supplierHealth,
      supplierFunnel: [
        { stage: "seller_apply_start", label: "Supplier Applications Started", count: 48, dropPct: 0 },
        { stage: "app_submitted", label: "Applications Submitted", count: 32, dropPct: 33 },
        { stage: "gst_approved", label: "GST & Manufacturing Verified", count: 22, dropPct: 31 },
        { stage: "first_listing_live", label: "First Product Listing Live", count: 18, dropPct: 18 },
        { stage: "first_wholesale_sale", label: "Achieved First B2B Sale", count: 14, dropPct: 22 },
      ],
      slaRules: {
        maxDispatchDays: 5.0,
        maxCancelRatePct: 10.0,
        maxStockoutDays: 3,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Page 7: Actions and Results (Holdout vs Treated, page 11-12 of plan)
  // -------------------------------------------------------------------------
  public getActionsAndResults() {
    const treated = this.actions.filter((a) => !a.in_holdout);
    const holdout = this.actions.filter((a) => a.in_holdout);

    const treatedCount = treated.length;
    const holdoutCount = holdout.length;

    const treatedPurchases = treated.filter((a) => a.outcome_purchased).length;
    const holdoutPurchases = holdout.filter((a) => a.outcome_purchased).length;

    const treatedRate = treatedCount > 0 ? (treatedPurchases / treatedCount) * 100 : 0;
    const holdoutRate = holdoutCount > 0 ? (holdoutPurchases / holdoutCount) * 100 : 0;
    const incrementalRate = treatedRate - holdoutRate;

    const treatedRevenue = treated.reduce((s, a) => s + (a.outcome_purchased ? a.outcome_value || 0 : 0), 0);
    const holdoutRevenue = holdout.reduce((s, a) => s + (a.outcome_purchased ? a.outcome_value || 0 : 0), 0);

    // Page 12 rule: Label "too early" until each group has at least 100 eligible visitors
    const isTooEarly = treatedCount < 100 || holdoutCount < 100;

    return {
      treatedCount,
      holdoutCount,
      treatedPurchases,
      holdoutPurchases,
      treatedConversionRate: treatedRate.toFixed(1) + "%",
      holdoutConversionRate: holdoutRate.toFixed(1) + "%",
      incrementalConversionRate: (incrementalRate >= 0 ? "+" : "") + incrementalRate.toFixed(1) + "%",
      treatedRevenueRupees: treatedRevenue,
      holdoutRevenueRupees: holdoutRevenue,
      isTooEarly,
      tooEarlyReason: isTooEarly
        ? `Holdout sample size is ${holdoutCount} (requires 100+ visitors per group to eliminate noise)`
        : null,
      actionsList: this.actions.slice(0, 50),
    };
  }

  // -------------------------------------------------------------------------
  // Page 8: System Health (page 11 & 13 of plan)
  // -------------------------------------------------------------------------
  public getSystemHealth() {
    const totalEvents = this.rawEvents.length;
    const eventsWithCustomerId = this.rawEvents.filter((e) => Boolean(e.customer_id)).length;
    const identifiedSharePct = totalEvents > 0 ? Math.round((eventsWithCustomerId / totalEvents) * 100) : 0;
    const eventsPerSession = this.sessions.length > 0 ? (totalEvents / this.sessions.length).toFixed(1) : "0.0";

    return {
      identifiedCustomerSharePct: identifiedSharePct,
      identifiedTargetSla: "35%+",
      isTrackerHealthy: identifiedSharePct >= 30,
      eventsPerSession,
      errorsByRoute: [
        { route: "/api/checkout/payment", errors5xx: 3, errors4xx: 1, avgLatencyMs: 340, status: "Investigating" },
        { route: "/api/collect", errors5xx: 0, errors4xx: 0, avgLatencyMs: 28, status: "Healthy" },
        { route: "/api/track-hesitation", errors5xx: 0, errors4xx: 0, avgLatencyMs: 32, status: "Healthy" },
        { route: "/products/[slug]", errors5xx: 0, errors4xx: 2, avgLatencyMs: 65, status: "Healthy" },
      ],
      collectorStatus: {
        beaconBatchIntervalSec: 5,
        dedupOnEventId: true,
        botFilterActive: true,
        dpdpConsentBannerActive: true,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Task 8: Verification with Synthetic Sessions (page 18 of plan)
  // -------------------------------------------------------------------------
  public runSyntheticTestVerification() {
    const tests = [
      {
        id: "T1_TECH_FAIL",
        name: "Payment Failure Diagnostic",
        session: {
          session_id: "synth_sess_1",
          visitor_key: "synth_buyer_1",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "google",
          device: "desktop",
          pages: 4,
          max_stage: "checkout" as const,
          cart_value: 8500,
          had_error: true,
          is_lost: true,
        },
        events: [
          {
            event_id: "s1_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s1_a",
            session_id: "synth_sess_1",
            event_name: "payment_fail",
            props: { error_code: "BANK_DECLINED" },
          },
        ],
        expectedCause: "technical_failure",
        expectedConfidence: "high",
      },
      {
        id: "T2_SUPPLY_OOS",
        name: "Zero Stock Product Cart View",
        session: {
          session_id: "synth_sess_2",
          visitor_key: "synth_buyer_2",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "direct",
          device: "mobile",
          pages: 3,
          max_stage: "cart" as const,
          cart_value: 4500,
          had_error: false,
          is_lost: true,
        },
        events: [
          {
            event_id: "s2_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s2_a",
            session_id: "synth_sess_2",
            event_name: "out_of_stock_view",
            product_id: "prod_soy_464",
          },
        ],
        expectedCause: "supply_problem",
        expectedConfidence: "high",
      },
      {
        id: "T3_WHATSAPP_DIVERT",
        name: "WhatsApp Click from PDP",
        session: {
          session_id: "synth_sess_3",
          visitor_key: "synth_buyer_3",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "instagram",
          device: "mobile",
          pages: 4,
          max_stage: "view" as const,
          cart_value: 0,
          had_error: false,
          is_lost: false,
        },
        events: [
          {
            event_id: "s3_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s3_a",
            session_id: "synth_sess_3",
            event_name: "whatsapp_click",
            props: { inferred_intent: "bulk_inquiry" },
          },
        ],
        expectedCause: "whatsapp_diverted",
        expectedConfidence: "high",
      },
      {
        id: "T4_GST_ABANDON",
        name: "GST Invoicing Form Abandonment",
        session: {
          session_id: "synth_sess_4",
          visitor_key: "synth_buyer_4",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "google",
          device: "desktop",
          pages: 5,
          max_stage: "checkout" as const,
          cart_value: 6200,
          had_error: false,
          is_lost: true,
        },
        events: [
          {
            event_id: "s4_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s4_a",
            session_id: "synth_sess_4",
            event_name: "gst_field_focus",
          },
          {
            event_id: "s4_e2",
            ts: new Date().toISOString(),
            anonymous_id: "s4_a",
            session_id: "synth_sess_4",
            event_name: "gst_field_abandon",
          },
        ],
        expectedCause: "gst_block",
        expectedConfidence: "medium",
      },
      {
        id: "T5_SHIPPING_SHOCK",
        name: "Shipping Fee Cutoff (< ₹2,000)",
        session: {
          session_id: "synth_sess_5",
          visitor_key: "synth_buyer_5",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "direct",
          device: "mobile",
          pages: 4,
          max_stage: "cart" as const,
          cart_value: 1750,
          had_error: false,
          is_lost: true,
        },
        events: [
          {
            event_id: "s5_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s5_a",
            session_id: "synth_sess_5",
            event_name: "shipping_threshold_view",
            props: { amount_to_free_shipping: 250 },
          },
        ],
        expectedCause: "shipping_shock",
        expectedConfidence: "medium",
      },
      {
        id: "T6_TIER_CONFUSION",
        name: "Wholesale Tier Slabs Double View",
        session: {
          session_id: "synth_sess_6",
          visitor_key: "synth_buyer_6",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "google",
          device: "desktop",
          pages: 5,
          max_stage: "cart" as const,
          cart_value: 3800,
          had_error: false,
          is_lost: true,
        },
        events: [
          {
            event_id: "s6_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s6_a",
            session_id: "synth_sess_6",
            event_name: "tier_pricing_view",
          },
          {
            event_id: "s6_e2",
            ts: new Date().toISOString(),
            anonymous_id: "s6_a",
            session_id: "synth_sess_6",
            event_name: "tier_pricing_view",
          },
        ],
        expectedCause: "tier_confusion",
        expectedConfidence: "medium",
      },
      {
        id: "T7_TRUST_COA",
        name: "Double COA Lab Test Inspection",
        session: {
          session_id: "synth_sess_7",
          visitor_key: "synth_buyer_7",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "linkedin",
          device: "desktop",
          pages: 4,
          max_stage: "view" as const,
          cart_value: 0,
          had_error: false,
          is_lost: false,
        },
        events: [
          {
            event_id: "s7_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s7_a",
            session_id: "synth_sess_7",
            event_name: "coa_click",
          },
          {
            event_id: "s7_e2",
            ts: new Date().toISOString(),
            anonymous_id: "s7_a",
            session_id: "synth_sess_7",
            event_name: "coa_click",
          },
        ],
        expectedCause: "trust_hesitation",
        expectedConfidence: "medium",
      },
      {
        id: "T8_PRICE_COUPON",
        name: "Failed Coupon Code Attempt",
        session: {
          session_id: "synth_sess_8",
          visitor_key: "synth_buyer_8",
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          source: "direct",
          device: "desktop",
          pages: 5,
          max_stage: "cart" as const,
          cart_value: 2900,
          had_error: false,
          is_lost: true,
        },
        events: [
          {
            event_id: "s8_e1",
            ts: new Date().toISOString(),
            anonymous_id: "s8_a",
            session_id: "synth_sess_8",
            event_name: "coupon_fail",
            props: { code: "BULK20" },
          },
        ],
        expectedCause: "price_concern",
        expectedConfidence: "medium",
      },
    ];

    const results = tests.map((t) => {
      const diag = diagnoseSession(t.session, t.events as RawEvent[], this.supplierHealth);
      const passed =
        diag.cause === t.expectedCause && diag.confidence === t.expectedConfidence;
      return {
        id: t.id,
        testName: t.name,
        expectedCause: t.expectedCause,
        actualCause: diag.cause,
        expectedConfidence: t.expectedConfidence,
        actualConfidence: diag.confidence,
        passed,
        evidence: diag.evidence,
      };
    });

    const allPassed = results.every((r) => r.passed);
    return {
      allPassed,
      totalTests: results.length,
      passedCount: results.filter((r) => r.passed).length,
      results,
    };
  }

  // -------------------------------------------------------------------------
  // On-Demand LLM Explain and WhatsApp Message Draft (page 5 & 18 of plan)
  // -------------------------------------------------------------------------
  public generateExplainAndDraft(sessionId: string) {
    const diag = this.diagnoses.find((d) => d.session_id === sessionId);
    if (!diag) {
      return {
        error: "Session diagnosis not found",
      };
    }

    const name = diag.customer_name || "there";
    const phone = diag.customer_phone || "+91 98000 00000";
    const meta = CAUSE_METADATA[diag.cause];

    let plainEnglishSummary = "";
    let whatsappDraft = "";

    switch (diag.cause) {
      case "technical_failure":
        plainEnglishSummary = `This customer had ₹${diag.cart_value.toLocaleString("en-IN")} in their checkout cart, but their payment failed due to a bank gateway timeout. They did not abandon deliberately—our site failed them.`;
        whatsappDraft = `Hi ${name}! 👋 This is Ekora Wholesale. We noticed a payment gateway glitch when you attempted your recent wholesale order (₹${diag.cart_value.toLocaleString("en-IN")}). Sincere apologies! Your cart has been reserved, and here is a direct 1-click retry link: https://ekorabazaar.in/checkout/retry?sid=${diag.session_id}. Let us know if you need any assistance! 🙏`;
        break;

      case "supply_problem":
        plainEnglishSummary = `The customer wanted to order craft raw materials, but the item was either out of stock or supplied by a delayed vendor.`;
        whatsappDraft = `Hi ${name}! 👋 Ekora Wholesale team here. We noticed you checked our craft raw materials, but stock was temporarily unavailable. We have fresh certified inventory arriving in 48 hours, or we can dispatch an alternative batch immediately. Would you like priority allocation? 😊`;
        break;

      case "whatsapp_diverted":
        plainEnglishSummary = `The customer clicked through to WhatsApp directly from the product page to ask questions about bulk volume specifications.`;
        whatsappDraft = `Hi ${name}! 👋 Following up from Ekora Wholesale. Thank you for connecting with us on WhatsApp regarding your craft materials inquiry. Our wholesale sourcing desk is available to assist with custom batch pricing or samples! 🕯️`;
        break;

      case "gst_block":
        plainEnglishSummary = `The customer paused at the GSTIN invoicing field in checkout and exited without completing payment, likely unsure whether GST is mandatory.`;
        whatsappDraft = `Hi ${name}! 👋 Ekora Wholesale here. Quick note regarding your checkout: GSTIN is 100% optional! You can complete your order without entering GST details, or if you do have a GSTIN, we will provide a verified tax invoice for 18% Input Tax Credit. Would you like us to finalize the order for you? 🛒`;
        break;

      case "shipping_shock":
        const diff = 2000 - diag.cart_value;
        plainEnglishSummary = `Cart value is ₹${diag.cart_value.toLocaleString("en-IN")}, which is just ₹${diff > 0 ? diff : 200} short of the ₹2,000 Free Shipping threshold. The buyer abandoned when delivery fee appeared.`;
        whatsappDraft = `Hi ${name}! 👋 Ekora Wholesale here. You were only ₹${diff > 0 ? diff : 200} away from FREE shipping on your order! Add a small wick pack or fragrance tester to cross ₹2,000 and save on delivery charges: https://ekorabazaar.in/cart 🚚`;
        break;

      case "tier_confusion":
        plainEnglishSummary = `The buyer repeatedly viewed wholesale pricing tiers or shifted quantity steppers between 12 and 52 units without understanding the discount breakdown.`;
        whatsappDraft = `Hi ${name}! 👋 Ekora Wholesale here. We noticed you were exploring our bulk quantity slabs. For orders above 12 units we offer 12% off, and 50+ units get 22% off wholesale. Tell us what volume you need and we will share an instant customized price! 📦`;
        break;

      case "trust_hesitation":
        plainEnglishSummary = `The buyer inspected Certificate of Analysis (COA) / IFRA test reports multiple times, indicating quality verification interest.`;
        whatsappDraft = `Hi ${name}! 👋 Ekora Wholesale here. We saw you were reviewing our lab compliance reports. All our craft supplies are 100% batch-tested with verified COA and IFRA certificates. Can we send you the purity analysis for your specific formulation batch? 🔬`;
        break;

      case "price_concern":
        plainEnglishSummary = `The buyer attempted a promo code or reduced quantities in their cart before exiting.`;
        whatsappDraft = `Hi ${name}! 👋 Ekora Wholesale here. If you are balancing formulation budgets for your craft studio, we can offer a special 5% starter discount on your sample batch. Let us know how we can help! 🙏`;
        break;

      default:
        plainEnglishSummary = `The session browsed product specifications and catalog without a decisive hesitation flag.`;
        whatsappDraft = `Hi ${name}! 👋 Thank you for visiting Ekora Wholesale. If you are looking for specific candle waxes, wicks, or fragrance oils for your workshop, we are here to help! 🕯️`;
        break;
    }

    return {
      session_id: diag.session_id,
      visitor_key: diag.visitor_key,
      customer_name: name,
      customer_phone: phone,
      cause: diag.cause,
      cause_label: meta.label,
      confidence: diag.confidence,
      evidence: diag.evidence,
      plainEnglishSummary,
      whatsappDraft,
      waLink: `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappDraft)}`,
    };
  }
}

// Global Singleton for in-memory session persistence
const globalStore = (global as any).__customerIntelligenceStore || new CustomerIntelligenceStore();
if (process.env.NODE_ENV !== "production") {
  (global as any).__customerIntelligenceStore = globalStore;
}

export const ciStore = globalStore as CustomerIntelligenceStore;
