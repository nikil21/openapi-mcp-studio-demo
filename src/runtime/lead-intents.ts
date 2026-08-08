import { createHash, randomUUID } from "node:crypto";

export type LeadPayload = { name: string; email: string; company?: string };

type Intent = { expiresAt: number; consumed: boolean };

const intents = new Map<string, Intent>();
const intentLifetimeMs = 5 * 60_000;

export function validateLeadPayload(value: LeadPayload): LeadPayload {
  const payload = { name: value.name.trim(), email: value.email.trim(), ...(value.company === undefined ? {} : { company: value.company.trim() }) };
  if (payload.name.length < 1 || payload.name.length > 120) throw new Error("Name must contain between 1 and 120 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) throw new Error("Enter a valid email address.");
  if (payload.company !== undefined && (payload.company.length < 1 || payload.company.length > 120)) throw new Error("Company must contain between 1 and 120 characters.");
  return payload;
}

export function createLeadIntent() {
  const id = randomUUID();
  intents.set(id, { expiresAt: Date.now() + intentLifetimeMs, consumed: false });
  console.log(JSON.stringify({ event: "lead_intent_created", intentId: id }));
  return id;
}

export function consumeLeadIntent(id: string, payload: LeadPayload) {
  const intent = intents.get(id);
  if (intent === undefined || intent.consumed || intent.expiresAt < Date.now()) throw new Error("This demo submission has expired. Start a new lead capture.");
  intent.consumed = true;
  const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  console.log(JSON.stringify({ event: "lead_intent_confirmed", intentId: id, payloadHash }));
  return payloadHash;
}
