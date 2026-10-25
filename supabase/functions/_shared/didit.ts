import { countryCodes } from "./countries.ts";

export const CONSENT_VERSION = "2026-09-20";
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type RecordValue = Record<string, unknown>;
export function object(value: unknown): RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
}
export function countryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const result = countryCodes[value.trim().toUpperCase()];
  return result && result !== "XK" ? result : null;
}
export function verificationUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === "https://verify.didit.me" &&
      !url.username &&
      !url.password &&
      /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?session\/[A-Za-z0-9_-]+$/.test(
        url.pathname,
      )
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
// Serialize sorted keys directly: numeric-looking JSON keys must also remain
// lexically ordered. No provider SDK or raw identity fields are sent to logs.
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (key) =>
            JSON.stringify(key) +
            ":" +
            canonicalJson((value as RecordValue)[key]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export async function verifyWebhook(
  body: RecordValue,
  headers: Headers,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  const timestamp = headers.get("x-timestamp") ?? "";
  const signature = headers.get("x-signature-v2") ?? "";
  if (
    !/^\d{10}$/.test(timestamp) ||
    !/^[a-f0-9]{64}$/i.test(signature) ||
    secret.length < 20 ||
    Math.abs(now / 1000 - Number(timestamp)) > 300 ||
    body.timestamp !== Number(timestamp)
  )
    return false;
  const expected = await hmac(canonicalJson(body), secret);
  let difference = 0;
  for (let i = 0; i < expected.length; i++)
    difference |=
      expected.charCodeAt(i) ^ signature.toLowerCase().charCodeAt(i);
  return difference === 0;
}
export type IdentityOutcome = {
  status:
    | "pending"
    | "in_review"
    | "verified"
    | "needs_review"
    | "declined"
    | "expired"
    | "test_only";
  nationalityCodes: string[];
  subjectHash: string | null;
  validUntil: string | null;
};
export async function evaluateDecision(
  value: unknown,
  expected: {
    sessionId: string;
    attemptId: string;
    workflowId: string;
    hashSecret: string;
  },
  now = Date.now(),
): Promise<IdentityOutcome> {
  const decision = object(value);
  const result = (status: IdentityOutcome["status"]): IdentityOutcome => ({
    status,
    nationalityCodes: [],
    subjectHash: null,
    validUntil: null,
  });
  if (
    decision.session_id !== expected.sessionId ||
    decision.vendor_data !== expected.attemptId ||
    decision.workflow_id !== expected.workflowId ||
    decision.session_kind !== "user"
  )
    throw new Error("decision_binding_mismatch");
  // Sandbox approvals must never grant real community rights.
  if (decision.environment !== "live") return result("test_only");
  if (["Expired", "Kyc Expired", "Abandoned"].includes(String(decision.status)))
    return result("expired");
  if (decision.status === "Declined") return result("declined");
  if (decision.status === "In Review") return result("in_review");
  if (decision.status !== "Approved") return result("pending");
  const ids = decision.id_verifications;
  const lives = decision.liveness_checks;
  const matches = decision.face_matches;
  if (
    !Array.isArray(ids) ||
    ids.length !== 1 ||
    !Array.isArray(lives) ||
    lives.length !== 1 ||
    !Array.isArray(matches) ||
    matches.length !== 1
  )
    return result("needs_review");
  const id = object(ids[0]),
    live = object(lives[0]),
    face = object(matches[0]);
  if (
    [id, live, face].some((report) => report.status !== "Approved") ||
    id.verification_method !== "document" ||
    !["P", "Passport"].includes(String(id.document_type)) ||
    (face.source_image_session_id &&
      face.source_image_session_id !== expected.sessionId)
  )
    return result("needs_review");
  // Never substitute issuing_state, IP, expected_details or a user's selection
  // when a document does not contain a recognized nationality.
  const nationality = countryCode(id.nationality),
    issuer = countryCode(id.issuing_state);
  const number =
    typeof id.document_number === "string"
      ? id.document_number.replace(/\s/g, "").toUpperCase()
      : "";
  const date = typeof id.expiration_date === "string" ? id.expiration_date : "";
  const expiry = Date.parse(date + "T23:59:59.000Z");
  if (
    !nationality ||
    !issuer ||
    !/^[A-Z0-9-]{4,100}$/.test(number) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(expiry) ||
    new Date(expiry).toISOString().slice(0, 10) !== date ||
    expected.hashSecret.length < 32
  )
    return result("needs_review");
  const providerExpiry =
    decision.expires_at == null
      ? Infinity
      : Date.parse(String(decision.expires_at));
  const validUntil = Math.min(expiry, providerExpiry, now + 365 * 86400_000);
  if (!Number.isFinite(validUntil) || validUntil <= now)
    return result("expired");
  return {
    status: "verified",
    nationalityCodes: [nationality],
    subjectHash: await hmac(
      JSON.stringify(["didit", "passport", issuer, number]),
      expected.hashSecret,
    ),
    validUntil: new Date(validUntil).toISOString(),
  };
}
