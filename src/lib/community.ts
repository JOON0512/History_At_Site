import { createClient } from "@supabase/supabase-js";
import { readAuthReturn } from "./auth";

// Capture only the return intent before the SDK consumes the email-link hash.
export const initialAuthReturn =
  typeof window === "undefined"
    ? { recovery: false, confirmation: false, error: false }
    : readAuthReturn(window.location.href);

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const supabase = url && key ? createClient(url, key) : null;
// Open public email flows only after the sender has been connected and tested.
export const emailDeliveryReady =
  import.meta.env.VITE_AUTH_EMAIL_DELIVERY_READY === "true";
export const initialIdentityReturn =
  typeof window !== "undefined" &&
  new URL(window.location.href).searchParams.get("identity") === "return";

export type Verification = {
  identity_verified: boolean;
  nationality_verified: boolean;
  can_comment: boolean;
};
export type Comment = {
  id: string;
  author_id: string;
  author_nationality_codes: string[];
  body: string;
  source_url: string | null;
  spoiler: boolean;
  created_at: string;
  profiles: { display_name: string } | null;
};

export function nationalityLabel(codes: string[]): string {
  const names = new Intl.DisplayNames(["ko"], { type: "region" });
  return codes
    .map((code) => {
      try {
        return names.of(code) ?? code;
      } catch {
        return code;
      }
    })
    .join(" · ");
}

export function safeSourceUrl(value: string): string | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function validateComment(body: string, source: string): string | null {
  if (!body.trim()) return "이야기를 입력해주세요.";
  if (body.trim().length > 2000) return "댓글은 2,000자까지 작성할 수 있어요.";
  if (source.trim() && (!safeSourceUrl(source) || source.length > 2048))
    return "자료 링크는 2,048자 이내의 http 또는 https 주소로 입력해주세요.";
  return null;
}

export function canParticipate(verification: Verification | null): boolean {
  return (
    !!verification?.can_comment &&
    verification.identity_verified &&
    verification.nationality_verified
  );
}
