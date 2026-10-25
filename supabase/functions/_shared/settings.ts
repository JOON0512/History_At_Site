import type { IdentitySettings } from "./identity-handler.ts";
declare const Deno: { env: { get(name: string): string | undefined } };
export function settings(): IdentitySettings {
  const env = (name: string) => Deno.env.get(name) ?? "";
  let adminKey = env("SUPABASE_SERVICE_ROLE_KEY");
  try {
    adminKey = JSON.parse(env("SUPABASE_SECRET_KEYS"))?.default || adminKey;
  } catch {
    /* older projects */
  }
  return {
    supabaseUrl: env("SUPABASE_URL"),
    adminKey,
    apiKey: env("DIDIT_API_KEY"),
    workflowId: env("DIDIT_WORKFLOW_ID"),
    webhookSecret: env("DIDIT_WEBHOOK_SECRET"),
    hashSecret: env("IDENTITY_SUBJECT_HASH_KEY"),
    enabled: env("DIDIT_ENABLED") === "true",
    allowedOrigins: [
      "https://has.example",
      "http://127.0.0.1:5173",
    ],
  };
}
