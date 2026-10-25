import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { films } from "../src/data/films";

const db = new PGlite();
const verified = "00000000-0000-4000-8000-000000000001";
const unverified = "00000000-0000-4000-8000-000000000002";
const other = "00000000-0000-4000-8000-000000000003";

async function asUser(user: string, query: string) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`,
  );
  try {
    return await db.exec(query);
  } finally {
    await db.exec("reset role;");
  }
}

beforeAll(async () => {
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  const migrations = new URL("../supabase/migrations/", import.meta.url);
  for (const file of readdirSync(migrations)
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(new URL(file, migrations), "utf8"));
  }
  await db.exec(`insert into auth.users values('${verified}'),('${unverified}'),('${other}');
    insert into private.verifications values
    ('${verified}','test-only','subject-1',now()-interval '1 day',now()-interval '1 day',array['KR'],now()-interval '1 day',now()+interval '30 days'),
    ('${other}','test-only','subject-3',now()-interval '1 day',now()-interval '1 day',array['GB','FR'],now()-interval '1 day',now()+interval '30 days');`);
}, 30000);
afterAll(async () => {
  await db.close();
});

describe("server-enforced community permissions", () => {
  it("keeps every archive title registered for community foreign keys", async () => {
    const { rows } = await db.query<{ id: string }>(
      "select id from public.films order by id",
    );
    expect(rows.map((row) => row.id)).toEqual(
      films.map((film) => film.id).sort(),
    );
    await db.exec(
      readFileSync(
        new URL(
          "../supabase/migrations/002_expand_film_collection.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const repeated = await db.query<{ count: number }>(
      "select count(*)::int as count from public.films",
    );
    expect(repeated.rows[0].count).toBe(films.length);
  });
  it("allows verified authors and publishes confirmed nationalities", async () => {
    await asUser(
      verified,
      `insert into public.comments(film_id,author_id,body) values('about-time','${verified}','콘월의 풍경이 기억나요.');`,
    );
    const { rows } = await db.query<{ nationality_codes: string[] }>(
      `select nationality_codes from public.profiles where id='${verified}'`,
    );
    expect(rows[0].nationality_codes).toEqual(["KR"]);
    const comments = await db.query<{ author_nationality_codes: string[] }>(
      "select author_nationality_codes from public.comments",
    );
    expect(comments.rows[0].author_nationality_codes).toEqual(["KR"]);
  });
  it("rejects unverified, anonymous and forged-author inserts", async () => {
    await expect(
      asUser(
        unverified,
        `insert into public.comments(film_id,author_id,body) values('troy','${unverified}','unauthorized');`,
      ),
    ).rejects.toThrow();
    await expect(
      asUser(
        verified,
        `insert into public.comments(film_id,author_id,body) values('troy','${other}','forged');`,
      ),
    ).rejects.toThrow();
    await db.exec("set role anon;");
    try {
      await expect(
        db.exec(
          `insert into public.comments(film_id,author_id,body) values('troy','${unverified}','anonymous');`,
        ),
      ).rejects.toThrow();
    } finally {
      await db.exec("reset role;");
    }
  });
  it("prevents users from self-verifying or changing their public nationality", async () => {
    await expect(
      asUser(unverified, `select * from private.verifications;`),
    ).rejects.toThrow();
    await expect(
      asUser(
        unverified,
        `update public.profiles set nationality_codes=array['KR'] where id='${unverified}';`,
      ),
    ).rejects.toThrow();
    await expect(
      asUser(
        unverified,
        `select public.record_identity_verification('${unverified}','fake','01234567890123456789012345678901',array['KR'],now(),now(),now()+interval '1 day');`,
      ),
    ).rejects.toThrow();
    await asUser(
      verified,
      `update public.profiles set display_name='영화 여행자' where id='${verified}';`,
    );
    await asUser(
      unverified,
      `update public.profiles set display_name='hijacked' where id='${verified}';`,
    );
    const { rows } = await db.query<{ display_name: string }>(
      `select display_name from public.profiles where id='${verified}'`,
    );
    expect(rows[0].display_name).toBe("영화 여행자");
  });
  it("rejects moderation and timestamp spoofing and rate-limits authors", async () => {
    await expect(
      asUser(
        other,
        `insert into public.comments(film_id,author_id,body,status) values('troy','${other}','test','visible');`,
      ),
    ).rejects.toThrow();
    await expect(
      asUser(
        verified,
        `insert into public.comments(film_id,author_id,body) values('troy','${verified}','too fast');`,
      ),
    ).rejects.toThrow();
  });
  it("hides moderated comments from other readers and protects deletion", async () => {
    await asUser(
      unverified,
      `delete from public.comments where author_id='${verified}';`,
    );
    const count = await db.query<{ count: number }>(
      "select count(*)::int as count from public.comments",
    );
    expect(count.rows[0].count).toBe(1);
    await db.exec(
      "update public.comments set status='hidden'; set role anon; select set_config('request.jwt.claim.sub','',false);",
    );
    try {
      const result = await db.query("select * from public.comments");
      expect(result.rows).toHaveLength(0);
    } finally {
      await db.exec("reset role; update public.comments set status='visible';");
    }
  });
  it("accepts private reports once and exposes them only to their author", async () => {
    const insert = `insert into public.comment_reports(comment_id,reporter_id,reason) select id,'${other}','Please check this source' from public.comments;`;
    await asUser(other, insert);
    await expect(asUser(other, insert)).rejects.toThrow();
    const results = await asUser(
      verified,
      "select * from public.comment_reports;",
    );
    expect(results[0].rows).toHaveLength(0);
  });
  it("rejects expired and blocked identities, and unsafe links", async () => {
    await expect(
      asUser(
        other,
        `insert into public.comments(film_id,author_id,body,source_url) values('troy','${other}','link','javascript:alert(1)');`,
      ),
    ).rejects.toThrow();
    await db.exec(
      `update private.verifications set expires_at=now()-interval '1 second' where user_id='${other}';`,
    );
    await expect(
      asUser(
        other,
        `insert into public.comments(film_id,author_id,body) values('troy','${other}','expired');`,
      ),
    ).rejects.toThrow();
    await db.exec(
      `update private.verifications set expires_at=now()+interval '1 day' where user_id='${other}'; insert into private.blocked_users(user_id,reason) values('${other}','test');`,
    );
    await expect(
      asUser(
        other,
        `insert into public.comments(film_id,author_id,body) values('troy','${other}','blocked');`,
      ),
    ).rejects.toThrow();
    const result = await asUser(
      other,
      "select * from public.get_my_verification();",
    );
    expect(result[0].rows[0]).toMatchObject({ can_comment: false });
  });
});
