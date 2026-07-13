/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { GoogleOAuthButton, navigateToOAuthUrl } from "../google-oauth-button";

// ── Mocks ──────────────────────────────────────────────────

const mockAssign = vi.fn();
Object.defineProperty(window, "location", {
  value: { assign: mockAssign },
  writable: true,
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ── Helpers ────────────────────────────────────────────────

function jsonResponse(ok: boolean, body: unknown, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function networkError() {
  return Promise.reject(new TypeError("Failed to fetch"));
}

// ── Tests ──────────────────────────────────────────────────

describe("GoogleOAuthButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockAssign.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────

  it("renders the button with accessible name", () => {
    render(<GoogleOAuthButton />);
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
  });

  it("renders with custom nextPath prop", () => {
    render(<GoogleOAuthButton nextPath="/profile" />);
    const button = screen.getByRole("button", { name: "Continue with Google" });
    expect(button).toBeInTheDocument();
  });

  it("does not show error initially", () => {
    render(<GoogleOAuthButton />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // ── API contract ─────────────────────────────────────────

  it("sends one POST request to /api/auth/oauth/google on click", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(true, { success: true, data: { url: "https://accounts.google.com/o/oauth2/auth?..." } }),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/oauth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextPath: "/dashboard" }),
    });
  });

  it("sends custom nextPath in request body", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(true, { success: true, data: { url: "https://accounts.google.com/o/oauth2/auth?..." } }),
    );

    render(<GoogleOAuthButton nextPath="/profile" />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/oauth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextPath: "/profile" }),
    });
  });

  // ── Success navigation ───────────────────────────────────

  it("calls full-page navigation with the returned URL on success", async () => {
    const oauthUrl = "https://accounts.google.com/o/oauth2/auth?client_id=abc";
    mockFetch.mockResolvedValue(
      jsonResponse(true, { success: true, data: { url: oauthUrl } }),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledTimes(1);
      expect(mockAssign).toHaveBeenCalledWith(oauthUrl);
    });
  });

  // ── Pending state ────────────────────────────────────────

  it("shows loading state and disables button while pending", async () => {
    let resolveFetch!: (value: Response) => void;
    mockFetch.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    // Button should be disabled and show loading state
    expect(button).toBeDisabled();

    // Resolve the fetch to clean up
    await act(async () => {
      resolveFetch(jsonResponse(true, { success: true, data: { url: "https://example.com" } }));
    });
  });

  it("prevents duplicate submissions while pending", async () => {
    let resolveFetch!: (value: Response) => void;
    mockFetch.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    // Second click should not trigger another fetch
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Clean up
    await act(async () => {
      resolveFetch(jsonResponse(true, { success: true, data: { url: "https://example.com" } }));
    });
  });

  // ── Error handling ───────────────────────────────────────

  it("shows error on non-2xx response", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(false, { success: false, error: { code: "oauth_failed", message: "Provider error" } }, 500),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Provider error");
    });
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("shows error on malformed success response (no url)", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(true, { success: true, data: {} }),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to start Google sign-in. Please try again.",
      );
    });
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("shows error on malformed success response (success !== true)", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(true, { success: "maybe", data: { url: "https://example.com" } }),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to start Google sign-in. Please try again.",
      );
    });
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("shows error on malformed success response (null body)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(null),
    } as Response);

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to start Google sign-in. Please try again.",
      );
    });
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("shows error on network rejection", async () => {
    mockFetch.mockImplementation(() => networkError());

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to start Google sign-in. Please try again.",
      );
    });
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("shows error on invalid JSON response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    } as Response);

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to start Google sign-in. Please try again.",
      );
    });
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("uses safe error message from API when available", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(false, { success: false, error: { code: "rate_limited", message: "Too many requests" } }, 429),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Too many requests");
    });
  });

  it("falls back to generic error when API returns no message", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(false, { success: false, error: { code: "unexpected" } }, 500),
    );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to start Google sign-in. Please try again.",
      );
    });
  });

  // ── Error clears on retry ────────────────────────────────

  it("clears error when user retries after failure", async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(false, { success: false, error: { code: "oauth_failed", message: "Provider error" } }, 500),
      )
      .mockResolvedValueOnce(
        jsonResponse(true, { success: true, data: { url: "https://accounts.google.com/o/oauth2/auth?..." } }),
      );

    render(<GoogleOAuthButton />);
    const button = screen.getByRole("button", { name: "Continue with Google" });

    // First click — fails
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Provider error");
    });

    // Second click — succeeds
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(mockAssign).toHaveBeenCalled();
    });
  });

  // ── navigateToOAuthUrl helper ────────────────────────────

  it("navigateToOAuthUrl calls window.location.assign", () => {
    navigateToOAuthUrl("https://example.com");
    expect(mockAssign).toHaveBeenCalledWith("https://example.com");
  });
});
