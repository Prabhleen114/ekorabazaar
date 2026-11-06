export type CauseCode =
  | "technical_failure"
  | "supply_problem"
  | "whatsapp_diverted"
  | "gst_block"
  | "shipping_shock"
  | "tier_confusion"
  | "trust_hesitation"
  | "price_concern"
  | "unknown";

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

export type FunnelStage = "view" | "cart" | "checkout" | "purchase";

export interface RawEvent {
  event_id: string;
  ts: string; // ISO date
  anonymous_id: string;
  session_id: string;
  customer_id?: string | null;
  event_name: string;
  product_id?: string | null;
  page_path?: string;
  device?: string; // 'mobile' | 'desktop' | 'tablet'
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  props?: Record<string, any>;
  is_bot?: boolean;
  is_internal?: boolean;
}

export interface IdentityLink {
  anonymous_id: string;
  customer_id: string;
  linked_at: string;
}

export interface SessionRecord {
  session_id: string;
  visitor_key: string; // customer_id if known, else anonymous_id
  started_at: string;
  ended_at: string;
  source: string;
  device: string;
  pages: number;
  max_stage: FunnelStage;
  cart_value: number; // in Rupees
  had_error: boolean;
  is_lost: boolean;
  is_recovered?: boolean;
}

export interface SessionDiagnosis {
  session_id: string;
  visitor_key: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  cart_value: number;
  cause: CauseCode;
  cause_label: string;
  confidence: ConfidenceLevel;
  evidence: string[];
  secondary_causes?: string[];
  suggested_action: string;
  rule_version: string;
  diagnosed_at: string;
  handled?: boolean;
  handled_at?: string | null;
  handled_by?: string | null;
}

export interface StandingFlag {
  visitor_key: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  flag: "reorder_due" | "dormant_buyer" | "high_value_at_risk";
  flag_label: string;
  evidence: string[];
  confidence: ConfidenceLevel;
  action: string;
  first_detected_at: string;
  last_updated_at: string;
  resolved: boolean;
}

export interface ActionRecord {
  action_id: number;
  visitor_key: string;
  customer_name: string;
  customer_phone?: string;
  cause: CauseCode;
  action_type: string;
  in_holdout: boolean; // 10% holdout group
  status: "suggested" | "sent" | "skipped" | "done";
  created_at: string;
  handled_by?: string | null;
  handled_at?: string | null;
  outcome_purchased?: boolean;
  outcome_value?: number;
  outcome_margin?: number;
}

export interface SupplierHealthRecord {
  seller_id: string;
  seller_name: string;
  product_id: string;
  product_name: string;
  avg_dispatch_days: number; // flag > 5 days
  cancel_rate: number; // flag > 10%
  stockout_days_30d: number; // flag >= 3 days
  listing_completeness: number; // 0 to 100%
  has_coa_upload: boolean;
  has_photos: boolean;
  is_flagged: boolean;
  flag_reasons: string[];
  updated_at: string;
}

export interface ProductDemandDaily {
  day: string;
  product_id: string;
  product_name: string;
  category: string;
  price_inr: number;
  stock_count: number;
  views: number;
  carts: number;
  purchases: number;
  units_sold: number;
  searches: number;
  no_result_searches: number;
  oos_views: number;
  requests: number;
  whatsapp_clicks: number;
  top_diagnosis_cause?: string;
}

export interface SearchSynonym {
  id: string;
  raw_term: string;
  canonical_term: string;
  notes?: string;
}
