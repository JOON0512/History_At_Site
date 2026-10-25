// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import App from "../src/App";
import { films } from "../src/data/films";
import type { Film } from "../src/data/films";
vi.mock("../src/lib/community", () => ({
  supabase: null,
  initialIdentityReturn: false,
  initialAuthReturn: { recovery: false, confirmation: false, error: false },
}));
vi.mock("../src/components/Community", () => ({ default: () => null }));
vi.mock("../src/components/AccountDialog", () => ({ default: () => null }));
vi.mock("../src/components/Globe", () => ({
  default: ({
    films,
    onSelect,
  }: {
    films: Film[];
    onSelect: (film: Film) => void;
  }) => (
    <button onClick={() => onSelect(films[films.length - 1])}>
      지도에서 마지막 영화 선택
    </button>
  ),
}));
beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const listed = () =>
  Array.from(
    document.querySelectorAll(".film-item-info > strong"),
    (e) => e.textContent,
  );
const search = (value: string) =>
  fireEvent.change(screen.getByLabelText("영화, 장소, 시대 검색"), {
    target: { value },
  });

describe("large archive navigation", () => {
  it("makes all 525 works reachable across bounded pages and resets pagination for a search", () => {
    render(<App />);
    const seen: (string | null)[] = [];
    const pagination = within(
      screen.getByRole("navigation", { name: "영화 목록 페이지" }),
    );
    const next = pagination.getByRole("button", {
      name: "다음 영화 목록",
    }) as HTMLButtonElement;
    expect(
      (
        pagination.getByRole("button", {
          name: "이전 영화 목록",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    for (let page = 0; page < 14; page++) {
      expect(listed().length).toBeLessThanOrEqual(40);
      seen.push(...listed());
      if (page < 13) {
        expect(next.disabled).toBe(false);
        fireEvent.click(next);
      } else expect(next.disabled).toBe(true);
    }
    expect(seen).toEqual(films.map((f) => f.title));
    search("기생충");
    expect(listed()).toEqual(["기생충"]);
    expect(
      screen.queryByRole("navigation", { name: "영화 목록 페이지" }),
    ).toBeNull();
    search("없는영화이름");
    expect(listed()).toHaveLength(0);
    fireEvent.click(
      within(document.getElementById("film-list")!).getByRole("button", {
        name: "모든 작품 보기",
      }),
    );
    expect(listed()).toHaveLength(40);
  });
  it("reveals a map-selected film on its list page and filters historical settings independently of release", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "지도에서 마지막 영화 선택" }),
    );
    expect(listed()).toContain("탄나");
    expect(document.querySelector(".programme-title h2")?.textContent).toBe(
      "탄나",
    );
    fireEvent.click(screen.getByRole("button", { name: /MEDIEVAL 중세/ }));
    expect(listed()).toContain("라쇼몽");
    expect(listed()).not.toContain("탄나");
    search("라쇼몽");
    expect(listed()).toEqual(["라쇼몽"]);
  });
});
