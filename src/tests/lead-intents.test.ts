import { describe, expect, it } from "vitest";

import { consumeLeadIntent, createLeadIntent, validateLeadPayload } from "../runtime/lead-intents.js";

describe("demo lead intents", () => {
  it("normalizes a valid payload and consumes an intent only once", () => {
    const payload = validateLeadPayload({ name: " Demo User ", email: " demo@example.test ", company: " Example " });
    const intentId = createLeadIntent();
    expect(payload).toEqual({ name: "Demo User", email: "demo@example.test", company: "Example" });
    expect(consumeLeadIntent(intentId, payload)).toMatch(/^[a-f0-9]{64}$/);
    expect(() => consumeLeadIntent(intentId, payload)).toThrow("expired");
  });

  it("rejects malformed demo lead fields", () => {
    expect(() => validateLeadPayload({ name: "", email: "not-an-email" })).toThrow("Name");
  });
});
