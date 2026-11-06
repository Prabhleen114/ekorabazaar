import { describe, it, expect, beforeEach, vi } from "vitest";
import { isBotUserAgent, isRateLimited } from "@/app/api/collect/route";

describe("Customer Intelligence Collector API Unit Tests", () => {
  describe("Bot Filtering", () => {
    it("identifies crawler and search bot user agents", () => {
      expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
      expect(isBotUserAgent("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 HeadlessChrome/114.0.5735.179")).toBe(true);
      expect(isBotUserAgent("WhatsApp/2.21.11.17 A")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)")).toBe(true);
    });

    it("accepts valid human mobile and desktop browsers", () => {
      expect(
        isBotUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
      ).toBe(false);
      expect(
        isBotUserAgent(
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
        )
      ).toBe(false);
    });
  });

  describe("Rate Limiter", () => {
    it("allows standard request frequencies and throttles high-burst limits", () => {
      const testIp = "192.168.1.100";
      let throttled = false;
      for (let i = 0; i < 150; i++) {
        if (isRateLimited(testIp)) {
          throttled = true;
          break;
        }
      }
      expect(throttled).toBe(true);
    });
  });

  describe("Collector Payload Validation", () => {
    it("validates event payload structure correctly", async () => {
      const { POST } = await import("@/app/api/collect/route");
      const validPayload = {
        event_id: "evt_123456789",
        anonymous_id: "anon_test_123",
        session_id: "ses_test_456",
        event_name: "view_item",
        product_id: "prod_candle_soy_01",
        page_path: "/products/soy-butter-wax",
        device: "desktop",
      };

      const req = new Request("http://localhost:3000/api/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(validPayload),
      });

      const res = await POST(req as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.accepted).toBe(1);
    });

    it("rejects invalid payloads with status 400", async () => {
      const { POST } = await import("@/app/api/collect/route");
      const invalidPayload = {
        // missing event_id, anonymous_id, session_id
        event_name: "x",
      };

      const req = new Request("http://localhost:3000/api/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify(invalidPayload),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(400);
    });

    it("drops bots gracefully without failing", async () => {
      const { POST } = await import("@/app/api/collect/route");
      const payload = {
        event_id: "evt_bot_test_001",
        anonymous_id: "anon_bot_123",
        session_id: "ses_bot_456",
        event_name: "view_item",
      };

      const req = new Request("http://localhost:3000/api/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.dropped).toBe("bot");
    });
  });
});
