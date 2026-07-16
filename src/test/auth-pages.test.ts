import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
      getUser: mockGetUser,
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// ── Import after mocks ─────────────────────────────────────

import { register } from "@/app/register/actions";
import { login } from "@/app/login/actions";
import { logout } from "@/app/dashboard/actions";
// ── Tests ───────────────────────────────────────────────────

describe("register server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty email", async () => {
    const formData = new FormData();
    formData.set("email", "");
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    const result = await register({ success: false, message: "" }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Email and password are required");
  });

  it("rejects short password", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "short");
    formData.set("confirmPassword", "short");

    const result = await register({ success: false, message: "" }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Password must be at least 8 characters");
  });

  it("rejects mismatched passwords", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");
    formData.set("confirmPassword", "different123");

    const result = await register({ success: false, message: "" }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Passwords do not match");
  });

  it("returns success message when email confirmation required", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "1", email: "test@example.com", email_confirmed_at: null, created_at: "2024-01-01" },
        session: null,
      },
      error: null,
    });

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    const result = await register({ success: false, message: "" }, formData);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Check your email");
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("redirects to dashboard when autoconfirm is ON", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "1", email: "test@example.com", email_confirmed_at: "2024-01-01", created_at: "2024-01-01" },
        session: { access_token: "tok" },
      },
      error: null,
    });

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    await expect(
      register({ success: false, message: "" }, formData),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("returns error message from signUp failure", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "email_exists", message: "User already registered" },
    });

    const formData = new FormData();
    formData.set("email", "existing@example.com");
    formData.set("password", "password123");
    formData.set("confirmPassword", "password123");

    const result = await register({ success: false, message: "" }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("An account with this email already exists. Try signing in instead.");
  });
});

describe("login server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty email", async () => {
    const formData = new FormData();
    formData.set("email", "");
    formData.set("password", "password123");

    const result = await login({ success: false, message: "" }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Email and password are required");
  });

  it("rejects empty password", async () => {
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "");

    const result = await login({ success: false, message: "" }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Email and password are required");
  });

  it("redirects to dashboard on success", async () => {
    mockSignIn.mockResolvedValue({
      data: {
        user: { id: "1", email: "test@example.com", email_confirmed_at: "2024-01-01", created_at: "2024-01-01" },
        session: { access_token: "tok" },
      },
      error: null,
    });

    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "password123");

    await expect(
      login({ success: false, message: "" }, formData),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(mockSignIn).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("returns error message from signIn failure", async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "invalid_credentials", message: "Invalid login credentials" },
    });

    const formData = new FormData();
    formData.set("email", "wrong@example.com");
    formData.set("password", "wrongpass");

    const result = await login({ success: false, message: "" }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Invalid email or password. Please check your credentials and try again.");
  });
});

describe("logout server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signOut and redirects to home", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    await expect(logout()).rejects.toThrow("REDIRECT:/");

    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("redirects to home even if signOut fails", async () => {
    mockSignOut.mockResolvedValue({
      error: { code: "unexpected", message: "Sign out failed" },
    });

    await expect(logout()).rejects.toThrow("REDIRECT:/");
  });
});

describe("homepage", () => {
  it("exports a server component function", async () => {
    const mod = await import("@/app/page");
    expect(typeof mod.default).toBe("function");
  });
});
