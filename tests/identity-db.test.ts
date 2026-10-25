import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
const db = new PGlite();
const owner = "00000000-0000-4000-8000-000000000011",
  other = "00000000-0000-4000-8000-000000000012";
const provider = "00000000-0000-4000-8000-000000000021";
let attempt: string;
async function asUser(user: string, sql: string) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);`,
  );
  try {
    return await db.exec(sql);
  } finally {
    await db.exec("reset role;");
  }
}
beforeAll(async () => {
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  const dir = new URL("../supabase/migrations/", import.meta.url);
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(new URL(file, dir), "utf8"));
  await db.exec(`insert into auth.users values('${owner}'),('${other}');`);
}, 30000);
afterAll(() => db.close());
const finish = (event: string, status: string, at = "now()") =>
  `select public.finish_identity_session('${attempt}','${provider}','${event}',${at},'${status}',array['KR'],'${"a".repeat(64)}',now()+interval '30 days');`;

describe("identity consent, binding and server-only writes", () => {
  it("keeps session URLs, provider results and reservation functions private", async () => {
    for (const sql of [
      "select * from private.identity_sessions;",
      `select public.reserve_identity_session('${owner}','2026-09-20');`,
      `select public.get_identity_session('${owner}',null,false);`,
    ])
      await expect(asUser(other, sql)).rejects.toThrow();
    await expect(
      db.exec(
        `select public.reserve_identity_session('${owner}','wrong-version');`,
      ),
    ).rejects.toThrow("consent_required");
  });
  it("reserves and binds a session and throttles duplicate creation", async () => {
    const { rows } = await db.query<{ result: { id: string } }>(
      `select public.reserve_identity_session('${owner}','2026-09-20') as result`,
    );
    attempt = rows[0].result.id;
    await expect(
      db.exec(
        `select public.reserve_identity_session('${owner}','2026-09-20');`,
      ),
    ).rejects.toThrow("rate_limited");
    await db.exec(
      `select public.attach_identity_session('${attempt}','${provider}','https://verify.didit.me/ko/session/test-token');`,
    );
    const repeat = await db.query<{ result: { id: string } }>(
      `select public.reserve_identity_session('${owner}','2026-09-20') as result`,
    );
    expect(repeat.rows[0].result.id).toBe(attempt);
    expect(
      (await asUser(other, "select * from public.get_my_identity_status();"))[0]
        .rows,
    ).toHaveLength(0);
  });
  it("requires bound sessions, ignores duplicates and does not apply an old event over a newer result", async () => {
    await expect(
      db.exec(finish("mismatch", "verified").replace(provider, other)),
    ).rejects.toThrow("session_mismatch");
    await expect(asUser(owner, finish("forged", "verified"))).rejects.toThrow();
    await db.exec(finish("approved-1", "verified"));
    await db.exec(finish("approved-1", "declined"));
    await db.exec(finish("old-decline", "declined", "now()-interval '1 hour'"));
    expect(
      (await asUser(owner, "select * from public.get_my_verification();"))[0]
        .rows[0],
    ).toMatchObject({ can_comment: true });
    await db.exec(
      `select set_config('request.jwt.claim.sub','${owner}',false);`,
    );
    await asUser(
      owner,
      `insert into public.comments(film_id,author_id,body) values('troy','${owner}','테스트용 감상입니다.');`,
    );
  });
  it("withdraws consent, hides old comments and cannot be undone by a late provider result", async () => {
    await asUser(owner, "select public.withdraw_identity_consent();");
    await db.exec(finish("late-approval", "verified"));
    expect(
      (await asUser(owner, "select * from public.get_my_verification();"))[0]
        .rows[0],
    ).toMatchObject({ can_comment: false, identity_verified: false });
    expect(
      (
        await db.query<{ status: string; author_nationality_codes: string[] }>(
          "select status,author_nationality_codes from public.comments",
        )
      ).rows[0],
    ).toEqual({ status: "hidden", author_nationality_codes: [] });
    expect(
      (
        await db.query(
          `select * from private.verifications where user_id='${owner}'`,
        )
      ).rows,
    ).toHaveLength(0);
  });
});
