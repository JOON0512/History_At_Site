// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import IdentityVerification from "../src/components/IdentityVerification";

const api = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn() }));
vi.mock("../src/lib/community", () => ({
  supabase: { rpc: api.rpc, functions: { invoke: api.invoke } },
  nationalityLabel: () => "대한민국",
}));
vi.mock("../src/lib/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/lib/identity")>()),
  identityReady: true,
}));
beforeEach(() => {
  vi.clearAllMocks();
  api.rpc.mockResolvedValue({ data: [], error: null });
});
afterEach(cleanup);

describe("identity consent and error boundaries", () => {
  it("requires explicit consent and does not expose internal errors", async () => {
    api.invoke.mockRejectedValue(
      new Error("private provider credential or error"),
    );
    render(<IdentityVerification verification={null} />);
    const start = screen.getByRole("button", {
      name: /Verify identity/,
    }) as HTMLButtonElement;
    expect(start.disabled).toBe(true);
    fireEvent.click(start);
    expect(api.invoke).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I consent to identity verification/,
      }),
    );
    fireEvent.click(start);
    await screen.findByRole("alert");
    expect(api.invoke).toHaveBeenCalledWith("identity-session", {
      body: { action: "start", consent: true, consent_version: "2026-09-20" },
    });
    expect(screen.getByRole("alert").textContent).not.toContain(
      "private provider",
    );
  });
  it("requires separate withdrawal consent before hiding comments and refreshes account state", async () => {
    api.rpc.mockResolvedValue({
      data: [{ status: "pending", nationality_codes: [] }],
      error: null,
    });
    const onChange = vi.fn();
    render(<IdentityVerification verification={null} onChange={onChange} />);
    const withdraw = await screen.findByRole("button", {
      name: /동의 철회하기/,
    });
    fireEvent.click(withdraw);
    expect(
      api.rpc.mock.calls.some(([name]) => name === "withdraw_identity_consent"),
    ).toBe(false);
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I understand and withdraw consent/,
      }),
    );
    fireEvent.click(withdraw);
    await waitFor(() =>
      expect(api.rpc).toHaveBeenCalledWith("withdraw_identity_consent"),
    );
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });
});
