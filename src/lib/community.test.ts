import { describe, expect, it } from "vitest";
import { canParticipate, safeSourceUrl, validateComment } from "./community";
import { filterFilms } from "../data/films";

describe("archive and participation boundaries", () => {
  it("finds countries and alternative places while combining era filters", () => {
    expect(filterFilms("콘월", "all").map((f) => f.id)).toEqual(["about-time"]);
    expect(filterFilms("대한민국", "twentieth").map((f) => f.id)).toEqual(
      expect.arrayContaining([
        "taxi-driver",
        "taegukgi",
        "atlas-house-of-hummingbird",
      ]),
    );
    expect(filterFilms("TROY", "myth").map((f) => f.id)).toEqual(["troy"]);
    expect(filterFilms("TROY", "contemporary")).toHaveLength(0);
  });
  it("rejects executable source links and empty comments", () => {
    expect(safeSourceUrl("javascript:alert(1)")).toBeNull();
    expect(safeSourceUrl("data:text/html,test")).toBeNull();
    expect(validateComment("   ", "")).toBeTruthy();
    expect(validateComment("a".repeat(2001), "")).toBeTruthy();
    expect(
      validateComment("풍경이 좋아요.", "https://example.org/source"),
    ).toBeNull();
  });
  it("fails closed unless all required verification claims hold", () => {
    expect(canParticipate(null)).toBe(false);
    expect(
      canParticipate({
        identity_verified: true,
        nationality_verified: false,
        can_comment: true,
      }),
    ).toBe(false);
    expect(
      canParticipate({
        identity_verified: true,
        nationality_verified: true,
        can_comment: false,
      }),
    ).toBe(false);
    expect(
      canParticipate({
        identity_verified: true,
        nationality_verified: true,
        can_comment: true,
      }),
    ).toBe(true);
  });
});
