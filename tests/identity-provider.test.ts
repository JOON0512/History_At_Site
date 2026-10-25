import { describe, it, expect, vi } from "vitest";
import {
  canonicalJson,
  evaluateDecision,
  hmac,
  verifyWebhook,
  verificationUrl,
} from "../supabase/functions/_shared/didit";
import { identityHandlers } from "../supabase/functions/_shared/identity-handler";
import { safeVerificationUrl } from "../src/lib/identity";

const now = Date.parse("2026-09-20T04:00:00Z");
const expected = {
  sessionId: "11111111-1111-4111-8111-111111111111",
  attemptId: "22222222-2222-4222-8222-222222222222",
  workflowId: "33333333-3333-4333-8333-333333333333",
  hashSecret: "test-only-hmac-secret-with-more-than-32-characters",
};
const decision = () => ({
  session_id: expected.sessionId,
  vendor_data: expected.attemptId,
  workflow_id: expected.workflowId,
  session_kind: "user",
  environment: "live",
  status: "Approved",
  expires_at: null,
  id_verifications: [
    {
      verification_method: "document",
      status: "Approved",
      document_type: "P",
      nationality: "KOR",
      issuing_state: "USA",
      document_number: "FAKE-TEST-1234",
      expiration_date: "2030-01-01",
    },
  ],
  liveness_checks: [{ status: "Approved" }],
  face_matches: [{ status: "Approved" }],
});

describe("Didit identity result boundary", () => {
  it("uses the document nationality, never issuer, IP, or expected details; stores only a keyed digest", async () => {
    const result = await evaluateDecision(
      { ...decision(), expected_details: { nationality: "FRA" } },
      expected,
      now,
    );
    expect(result).toMatchObject({
      status: "verified",
      nationalityCodes: ["KR"],
    });
    expect(result.subjectHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(result)).not.toContain("FAKE-TEST-1234");
    expect(Date.parse(result.validUntil!)).toBe(now + 365 * 86400_000);
  });
  it("does not grant rights for sandbox approvals or absent nationalities", async () => {
    expect(
      (
        await evaluateDecision(
          { ...decision(), environment: "sandbox" },
          expected,
          now,
        )
      ).status,
    ).toBe("test_only");
    const missing = decision();
    missing.id_verifications[0].nationality = "";
    expect((await evaluateDecision(missing, expected, now)).status).toBe(
      "needs_review",
    );
    missing.id_verifications[0].nationality = "ZZZ";
    expect((await evaluateDecision(missing, expected, now)).status).toBe(
      "needs_review",
    );
  });
  it("requires all three checks and a valid passport, even if the overall session says Approved", async () => {
    const value = decision();
    value.face_matches[0].status = "In Review";
    expect((await evaluateDecision(value, expected, now)).status).toBe(
      "needs_review",
    );
    value.face_matches = [];
    expect((await evaluateDecision(value, expected, now)).status).toBe(
      "needs_review",
    );
    const expired = decision();
    expired.id_verifications[0].expiration_date = "2025-01-01";
    expect((await evaluateDecision(expired, expected, now)).status).toBe(
      "expired",
    );
    const license = decision();
    license.id_verifications[0].document_type = "DL";
    expect((await evaluateDecision(license, expected, now)).status).toBe(
      "needs_review",
    );
  });
  it("rejects session, user binding, workflow substitution and foreign source portraits", async () => {
    for (const changed of [
      { vendor_data: "another-account" },
      { session_id: "another-session" },
      { workflow_id: "another-workflow" },
    ]) {
      await expect(
        evaluateDecision({ ...decision(), ...changed }, expected, now),
      ).rejects.toThrow("binding");
    }
    expect(
      (
        await evaluateDecision(
          {
            ...decision(),
            face_matches: [
              {
                status: "Approved",
                source_image_session_id: "another-session",
              },
            ],
          },
          expected,
          now,
        )
      ).status,
    ).toBe("needs_review");
  });
  it("authenticates the entire webhook, rejects tampering, old timestamps and unsigned timestamp substitutions", async () => {
    const body = {
      timestamp: now / 1000,
      session_id: expected.sessionId,
      status: "Approved",
      decision: { nationality: "KOR", name: "테스트" },
    };
    const secret = "test-only-webhook-secret-long-enough";
    const headers = new Headers({
      "x-timestamp": String(now / 1000),
      "x-signature-v2": await hmac(canonicalJson(body), secret),
    });
    expect(await verifyWebhook(body, headers, secret, now)).toBe(true);
    expect(
      await verifyWebhook(
        { ...body, decision: { nationality: "USA" } },
        headers,
        secret,
        now,
      ),
    ).toBe(false);
    expect(await verifyWebhook(body, headers, secret, now + 301_000)).toBe(
      false,
    );
    headers.set("x-timestamp", String(now / 1000 + 60));
    expect(await verifyWebhook(body, headers, secret, now)).toBe(false);
    expect(
      canonicalJson({ "9": 1, "10": 2, nested: { z: [], a: "한글" } }),
    ).toBe('{"10":2,"9":1,"nested":{"a":"한글","z":[]}}');
  });
  it("restricts redirect links to Didit verification sessions on both server and client", () => {
    for (const value of [
      "https://verify.didit.me.attacker.example/session/token",
      "https://verify.didit.me@evil.example/session/token",
      "javascript:alert(1)",
      "https://verify.didit.me/settings",
    ]) {
      expect(verificationUrl(value)).toBeNull();
      expect(safeVerificationUrl(value)).toBeNull();
    }
    expect(
      verificationUrl("https://verify.didit.me/ko/session/aB123_token"),
    ).toBe("https://verify.didit.me/ko/session/aB123_token");
  });
});

describe("identity HTTP authentication", () => {
  const config = {
    supabaseUrl: "https://has-test.supabase.co",
    adminKey: "sb_secret_test_only",
    apiKey: "test-only-api-key",
    workflowId: expected.workflowId,
    webhookSecret: "test-only-webhook-secret-long-enough",
    hashSecret: expected.hashSecret,
    enabled: true,
    allowedOrigins: ["https://has.example"],
  };
  it("rejects unauthenticated requests before provider work, and rejects unsigned webhooks", async () => {
    const http = vi.fn();
    const handler = identityHandlers(config, http);
    expect(
      (
        await handler.session(
          new Request("https://edge.test", {
            method: "POST",
            headers: { Origin: "https://has.example" },
            body: "{}",
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await handler.webhook(
          new Request("https://edge.test", { method: "POST", body: "{}" }),
        )
      ).status,
    ).toBe(401);
    expect(http).not.toHaveBeenCalled();
  });
  it("does not trust a supplied user id or bypass missing consent", async () => {
    const http = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            id: expected.attemptId,
            email_confirmed_at: "2026-09-20",
          }),
        ),
      );
    const handler = identityHandlers(config, http);
    const result = await handler.session(
      new Request("https://edge.test", {
        method: "POST",
        headers: {
          Origin: "https://has.example",
          Authorization: "Bearer test.jwt.signature",
        },
        body: JSON.stringify({
          action: "start",
          user_id: "victim",
          consent: false,
        }),
      }),
    );
    expect(result.status).toBe(400);
    expect(http).toHaveBeenCalledTimes(1);
  });
});
