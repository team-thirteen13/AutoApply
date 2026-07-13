/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("lucide-react", () => ({
  Pencil: () => <span data-testid="pencil-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

vi.mock("@/components/ui/toast", () => ({
  Toast: ({ message, type }: { message: string; type: string }) => (
    <div data-testid="toast" data-type={type}>
      {message}
    </div>
  ),
}));

// ── Import after mocks ─────────────────────────────────────

import { ProfileForm } from "@/components/profile/profile-form";

// ── Test Data ──────────────────────────────────────────────

const mockProfile = {
  id: "profile-1",
  userId: "user-1",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1 234 567 890",
  location: "San Francisco, CA",
  githubUrl: "https://github.com/johndoe",
  linkedinUrl: "https://linkedin.com/in/johndoe",
  portfolioUrl: "https://johndoe.dev",
  tagline: "Senior Software Engineer",
  bio: "Experienced software engineer",
  imageUrl: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProfileForm — Initial render", () => {
  it("renders initial profile values in view mode", () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("+1 234 567 890")).toBeInTheDocument();
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
    expect(screen.getByText("https://github.com/johndoe")).toBeInTheDocument();
  });

  it("renders edit button in view mode", () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});

describe("ProfileForm — Edit mode", () => {
  it("opens edit mode when edit button clicked", async () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("+1 234 567 890")).toBeInTheDocument();
    });
  });

  it("email field is disabled (read-only)", async () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue("john@example.com");
      expect(emailInput).toBeDisabled();
    });
  });

  it("cancel restores original values", async () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode
    fireEvent.click(screen.getByText("Edit"));

    // Change name
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    });

    // Click cancel button in the form footer (last Cancel button)
    const cancelButtons = screen.getAllByText("Cancel");
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);

    // Verify view mode shows original value
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
    });
  });

  it("Escape exits edit mode", async () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode
    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(screen.getByText("Personal Information").closest("div")!, {
      key: "Escape",
    });

    // Should return to view mode
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("John Doe")).not.toBeInTheDocument();
    });
  });
});

describe("ProfileForm — Save behavior", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("valid save sends correct PATCH payload", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProfile }),
    } as Response);

    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode and change name
    fireEvent.click(screen.getByText("Edit"));
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    });

    // Click save
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Jane Doe" }),
      });
    });
  });

  it("unchanged fields are not sent in payload", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProfile }),
    } as Response);

    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode without changing anything
    fireEvent.click(screen.getByText("Edit"));
    await waitFor(() => {
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    });

    // Click save
    fireEvent.click(screen.getByText("Save Changes"));

    // Should show "No changes to save" toast, not make fetch call
    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
      expect(screen.getByTestId("toast")).toHaveTextContent("No changes to save");
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("successful save shows success feedback", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockProfile }),
    } as Response);

    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode and change name
    fireEvent.click(screen.getByText("Edit"));
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    });

    // Click save
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
      expect(screen.getByTestId("toast")).toHaveTextContent("Profile updated successfully");
      expect(screen.getByTestId("toast")).toHaveAttribute("data-type", "success");
    });
  });

  it("failed save shows safe error feedback", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: { message: "Server error" } }),
    } as Response);

    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode and change name
    fireEvent.click(screen.getByText("Edit"));
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    });

    // Click save
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
      expect(screen.getByTestId("toast")).toHaveTextContent("Server error");
      expect(screen.getByTestId("toast")).toHaveAttribute("data-type", "error");
    });
  });

  it("server validation error is form-level, not assigned to name", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: { code: "validation_error", message: "Invalid input data" },
      }),
    } as Response);

    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode and change name
    fireEvent.click(screen.getByText("Edit"));
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    });

    // Click save
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      // Error should be in toast, not under name field
      expect(screen.getByTestId("toast")).toBeInTheDocument();
      expect(screen.getByTestId("toast")).toHaveTextContent("Invalid input data");
      expect(screen.getByTestId("toast")).toHaveAttribute("data-type", "error");
    });
  });
});

describe("ProfileForm — Client validation", () => {
  it("displays field-level errors for empty required fields", async () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode
    fireEvent.click(screen.getByText("Edit"));

    // Clear required fields
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "" } });
    });

    // Click save
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });

  it("clears error when user types", async () => {
    render(<ProfileForm initialProfile={mockProfile} />);

    // Enter edit mode
    fireEvent.click(screen.getByText("Edit"));

    // Clear name field
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("John Doe");
      fireEvent.change(nameInput, { target: { value: "" } });
    });

    // Click save to trigger validation
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    // Type in name field
    const nameInput = screen.getByPlaceholderText("John Doe");
    fireEvent.change(nameInput, { target: { value: "J" } });

    await waitFor(() => {
      expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
    });
  });
});
