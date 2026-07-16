/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  Pencil: () => <span data-testid="pencil-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  MoreVertical: () => <span data-testid="more-icon" />,
}));

vi.mock("@/app/dashboard/actions", () => ({
  deleteResumeAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
  }: {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button onClick={onCancel}>{cancelLabel ?? "Cancel"}</button>
        <button onClick={onConfirm}>{confirmLabel ?? "Confirm"}</button>
      </div>
    ) : null,
}));

// ── Import after mocks ─────────────────────────────────────

import { ResumeCard } from "@/components/dashboard/resume-card";

// ── Test Data ──────────────────────────────────────────────

const mockResume = {
  id: "resume-1",
  userId: "user-1",
  title: "Software Engineer Resume",
  targetRole: "Senior Developer",
  filePath: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
};

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ResumeCard — Delete confirmation", () => {
  it("renders delete button", () => {
    render(<ResumeCard resume={mockResume} />);
    expect(screen.getByTestId("more-icon")).toBeInTheDocument();
  });

  it("opens menu when more options clicked", async () => {
    render(<ResumeCard resume={mockResume} />);
    
    const moreButton = screen.getByLabelText("More options");
    fireEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });
  });

  it("opens confirm dialog when delete clicked", async () => {
    render(<ResumeCard resume={mockResume} />);
    
    // Open menu
    const moreButton = screen.getByLabelText("More options");
    fireEvent.click(moreButton);

    // Click delete
    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      fireEvent.click(deleteButton);
    });

    // Verify dialog opens
    await waitFor(() => {
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      expect(screen.getByText("Delete Resume")).toBeInTheDocument();
    });
  });

  it("cancel closes dialog without deleting", async () => {
    const { deleteResumeAction } = await import("@/app/dashboard/actions");
    
    render(<ResumeCard resume={mockResume} />);
    
    // Open menu and click delete
    fireEvent.click(screen.getByLabelText("More options"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("Delete"));
    });

    // Click cancel in dialog
    await waitFor(() => {
      fireEvent.click(screen.getByText("Cancel"));
    });

    // Verify dialog closed and delete not called
    await waitFor(() => {
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });
    expect(deleteResumeAction).not.toHaveBeenCalled();
  });

  it("confirm invokes delete once", async () => {
    const { deleteResumeAction } = await import("@/app/dashboard/actions");
    
    render(<ResumeCard resume={mockResume} />);
    
    // Open menu and click delete
    fireEvent.click(screen.getByLabelText("More options"));
    await waitFor(() => {
      fireEvent.click(screen.getByText("Delete"));
    });

    // Click confirm in dialog
    await waitFor(() => {
      fireEvent.click(screen.getByText("Delete", { selector: "button" }));
    });

    // Verify delete called once
    await waitFor(() => {
      expect(deleteResumeAction).toHaveBeenCalledTimes(1);
      expect(deleteResumeAction).toHaveBeenCalledWith("resume-1");
    });
  });
});
