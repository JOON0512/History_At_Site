import {
  CONSENT_VERSION,
  UUID,
  evaluateDecision,
  object,
  verificationUrl,
  verifyWebhook,
} from "./didit.ts";
import type { RecordValue } from "./didit.ts";

export type IdentitySettings = {
  supabaseUrl: string;
  adminKey: string;
  apiKey: string;
  workflowId: string;
  webhookSecret: string;
  hashSecret: string;
  enabled: boolean;
  allowedOrigins: string[];
};
class SafeError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
  ) {
    super(code);
  }
}
async function readJson(
  request: Request | Response,
  limit: number,
): Promise<RecordValue> {
  const reader = request.body?.getReader();
  if (!reader) throw new SafeError("invalid_request");
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new SafeError("request_too_large", 413);
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  try {
    return object(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    throw new SafeError("invalid_request");
  }
}
export function identityHandlers(
  config: IdentitySettings,
  http: typeof fetch = fetch,
) {
  const adminHeaders: Record<string, string> = {
    apikey: config.adminKey,
    "Content-Type": "application/json",
  };
  if (!config.adminKey.startsWith("sb_secret_"))
    adminHeaders.Authorization = `Bearer ${config.adminKey}`;
  const ready = () =>
    config.enabled &&
    config.apiKey.length > 10 &&
    UUID.test(config.workflowId) &&
    config.webhookSecret.length >= 20 &&
    config.hashSecret.length >= 32;
  const rpc = async (name: string, args: RecordValue) => {
    const response = await http(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      // Read only a known application error code; never echo raw DB/provider errors.
      const error = await readJson(response, 16384).catch(() => ({}));
      const message = object(error).message;
      if (
        [
          "rate_limited",
          "monthly_limit",
          "already_verified",
          "account_unavailable",
        ].includes(String(message))
      )
        throw new SafeError(
          String(message),
          message === "already_verified" ? 409 : 429,
        );
      throw new SafeError("verification_unavailable", 503);
    }
    if (response.status === 204) return null;
    return response.json();
  };
  const provider = async (path: string, body?: RecordValue) => {
    const response = await http("https://verification.didit.me/v3/" + path, {
      method: body ? "POST" : "GET",
      headers: {
        "x-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new SafeError("verification_unavailable", 503);
    return readJson(response, 2_000_000);
  };
  const applyDecision = async (
    attempt: RecordValue,
    eventKey: string,
    eventAt: string,
  ) => {
    const sessionId = String(attempt.provider_session_id);
    if (!UUID.test(sessionId) || !UUID.test(String(attempt.id)))
      throw new SafeError("verification_unavailable", 503);
    const decision = await provider(`session/${sessionId}/decision/`);
    const result = await evaluateDecision(decision, {
      sessionId,
      attemptId: String(attempt.id),
      workflowId: config.workflowId,
      hashSecret: config.hashSecret,
    });
    await rpc("finish_identity_session", {
      attempt_id: attempt.id,
      provider_id: sessionId,
      event_key: eventKey,
      event_at: eventAt,
      outcome: result.status,
      codes: result.nationalityCodes,
      subject_hash: result.subjectHash,
      valid_until: result.validUntil,
    });
    return result.status;
  };
  const json = (body: RecordValue, status = 200, origin?: string) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        ...(origin
          ? {
              "Access-Control-Allow-Origin": origin,
              Vary: "Origin",
              "Access-Control-Allow-Headers":
                "authorization, apikey, content-type, x-client-info",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
            }
          : {}),
      },
    });
  const handleError = (error: unknown, origin?: string) =>
    error instanceof SafeError
      ? json({ error: error.code }, error.status, origin)
      : json({ error: "verification_unavailable" }, 503, origin);
  return {
    async session(request: Request): Promise<Response> {
      const origin = request.headers.get("Origin") ?? "";
      if (!config.allowedOrigins.includes(origin))
        return json({ error: "origin_not_allowed" }, 403);
      if (request.method === "OPTIONS") return json({}, 200, origin);
      if (request.method !== "POST")
        return json({ error: "method_not_allowed" }, 405, origin);
      try {
        const authorization = request.headers.get("Authorization") ?? "";
        if (!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization))
          throw new SafeError("authentication_required", 401);
        const userResponse = await http(`${config.supabaseUrl}/auth/v1/user`, {
          headers: { apikey: config.adminKey, Authorization: authorization },
          signal: AbortSignal.timeout(8000),
        });
        if (!userResponse.ok)
          throw new SafeError("authentication_required", 401);
        const user = await readJson(userResponse, 32768);
        if (
          !UUID.test(String(user.id)) ||
          !user.email_confirmed_at ||
          user.is_anonymous === true
        )
          throw new SafeError("authentication_required", 401);
        const body = await readJson(request, 2048);
        if (!ready()) throw new SafeError("verification_not_ready", 503);
        if (body.action === "refresh") {
          const attempt = object(
            await rpc("get_identity_session", {
              target_user: user.id,
              claim_refresh: true,
            }),
          );
          if (!attempt.id || !attempt.provider_session_id || attempt.revoked_at)
            return json({ status: "unavailable" }, 200, origin);
          await applyDecision(
            attempt,
            `refresh:${crypto.randomUUID()}`,
            new Date().toISOString(),
          );
          return json({ ok: true }, 200, origin);
        }
        if (
          body.action !== "start" ||
          body.consent_version !== CONSENT_VERSION ||
          body.consent !== true
        )
          throw new SafeError("consent_required");
        const attempt = object(
          await rpc("reserve_identity_session", {
            target_user: user.id,
            consent_version: CONSENT_VERSION,
          }),
        );
        if (attempt.status === "in_review")
          return json({ status: "in_review" }, 200, origin);
        const existingUrl = verificationUrl(attempt.verification_url);
        if (existingUrl && attempt.provider_session_id)
          return json({ url: existingUrl }, 200, origin);
        if (!UUID.test(String(attempt.id)))
          throw new SafeError("verification_unavailable", 503);
        const created = await provider("session/", {
          workflow_id: config.workflowId,
          vendor_data: attempt.id,
          callback: origin + "/?identity=return",
          callback_method: "both",
          // Let Didit use the visitor's browser language, including English.
          expected_details: { expected_document_types: ["P"] },
        });
        const url = verificationUrl(created.url);
        if (
          !url ||
          !UUID.test(String(created.session_id)) ||
          created.workflow_id !== config.workflowId ||
          created.vendor_data !== attempt.id
        )
          throw new SafeError("verification_unavailable", 503);
        await rpc("attach_identity_session", {
          attempt_id: attempt.id,
          provider_id: created.session_id,
          session_url: url,
        });
        return json({ url }, 200, origin);
      } catch (error) {
        return handleError(error, origin);
      }
    },
    async webhook(request: Request): Promise<Response> {
      if (request.method !== "POST")
        return json({ error: "method_not_allowed" }, 405);
      try {
        if (!ready()) throw new SafeError("verification_not_ready", 503);
        const body = await readJson(request, 2_000_000);
        if (!(await verifyWebhook(body, request.headers, config.webhookSecret)))
          throw new SafeError("invalid_signature", 401);
        if (
          !["status.updated", "data.updated"].includes(
            String(body.webhook_type),
          )
        )
          return json({ ignored: true });
        if (
          body.environment !== "live" ||
          body.workflow_id !== config.workflowId
        )
          return json({ ignored: true });
        if (
          !UUID.test(String(body.session_id)) ||
          !UUID.test(String(body.event_id))
        )
          throw new SafeError("invalid_event");
        const attempt = object(
          await rpc("get_identity_session", { provider_id: body.session_id }),
        );
        if (!attempt.id) throw new SafeError("session_not_bound", 503); // retry a create/bind race
        if (attempt.revoked_at) return json({ ignored: true });
        // The signed callback is a notification; the authenticated API is the
        // source of truth. Ignore any embedded identity images or client fields.
        const eventTime =
          typeof body.created_at === "number"
            ? body.created_at
            : Number(body.timestamp);
        if (!Number.isFinite(eventTime) || eventTime > Date.now() / 1000 + 300)
          throw new SafeError("invalid_event");
        await applyDecision(
          attempt,
          `didit:${body.event_id}`,
          new Date(eventTime * 1000).toISOString(),
        );
        return json({ ok: true });
      } catch (error) {
        return handleError(error);
      }
    },
  };
}
