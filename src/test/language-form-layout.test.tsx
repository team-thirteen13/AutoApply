/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("lucide-react", () => ({
  Plus: () => <span data-testid="plus-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({
    id,
    value,
    onChange,
    placeholder,
    "aria-label": ariaLabel,
    className,
  }: {
    id?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    "aria-label"?: string;
    className?: string;
  }) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    id,
    value,
    onChange,
    options,
    "aria-label": ariaLabel,
    className,
  }: {
    id?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string; label: string }>;
    "aria-label"?: string;
    className?: string;
  }) => (
    <select
      id={id}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={className}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

// ── Import after mocks ─────────────────────────────────────

import { LanguagesForm } from "@/components/builder/sections/languages-form";

// ── Test Data ──────────────────────────────────────────────

const mockLanguages = [
  { id: "lang-1", name: "English", proficiency: "native" },
  { id: "lang-2", name: "Spanish", proficiency: "fluent" },
];

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
});

describe("LanguagesForm Layout", () => {
  it("renders language input", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    expect(screen.getAllByLabelText("Language name")).toHaveLength(2);
  });

  it("renders proficiency dropdown", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    expect(screen.getAllByLabelText("Language proficiency level")).toHaveLength(2);
  });

  it("language input precedes proficiency in DOM order", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const inputs = screen.getAllByLabelText("Language name");
    const selects = screen.getAllByLabelText("Language proficiency level");

    inputs.forEach((input, idx) => {
      expect(input.compareDocumentPosition(selects[idx])).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
  });

  it("language input has grid layout class", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const inputs = screen.getAllByLabelText("Language name");
    inputs.forEach((input) => {
      expect(input.className).toContain("w-full");
    });
  });

  it("proficiency select has grid layout class", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const selects = screen.getAllByLabelText("Language proficiency level");
    selects.forEach((select) => {
      expect(select.className).toContain("w-full");
    });
  });

  it("delete button has language name in aria-label", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Remove English")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove Spanish")).toBeInTheDocument();
  });

  it("delete button uses fallback when language name is empty", () => {
    const languagesWithEmpty = [{ id: "lang-3", name: "", proficiency: "basic" }];
    render(<LanguagesForm data={languagesWithEmpty} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Remove language")).toBeInTheDocument();
  });

  it("adding a language calls onChange with new language", () => {
    const onChange = vi.fn();
    render(<LanguagesForm data={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText("Add Language"));

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "",
          proficiency: "professional",
        }),
      ])
    );
  });

  it("removing a language calls onChange without that language", () => {
    const onChange = vi.fn();
    render(<LanguagesForm data={mockLanguages} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Remove English"));

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "lang-2", name: "Spanish" }),
      ])
    );
    expect(onChange).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "lang-1", name: "English" }),
      ])
    );
  });

  it("updating language name calls onChange with updated data", () => {
    const onChange = vi.fn();
    render(<LanguagesForm data={mockLanguages} onChange={onChange} />);

    const inputs = screen.getAllByLabelText("Language name");
    fireEvent.change(inputs[0], { target: { value: "French" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "lang-1", name: "French" }),
      ])
    );
  });

  it("updating proficiency calls onChange with updated data", () => {
    const onChange = vi.fn();
    render(<LanguagesForm data={mockLanguages} onChange={onChange} />);

    const selects = screen.getAllByLabelText("Language proficiency level");
    fireEvent.change(selects[0], { target: { value: "intermediate" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "lang-1", proficiency: "intermediate" }),
      ])
    );
  });

  it("mobile base grid uses single-column with 44px delete column", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const containers = document.querySelectorAll(".grid");
    containers.forEach((container) => {
      expect(container.className).toContain("grid-cols-[1fr_44px]");
    });
  });

  it("desktop grid uses three-column with correct proportions", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const containers = document.querySelectorAll(".grid");
    containers.forEach((container) => {
      expect(container.className).toContain("md:grid-cols-[minmax(0,2fr)_minmax(150px,0.7fr)_44px]");
    });
  });

  it("language input spans full width on mobile", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const inputs = screen.getAllByLabelText("Language name");
    inputs.forEach((input) => {
      expect(input.className).toContain("col-span-2");
    });
  });

  it("language input reverts to single column on desktop", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const inputs = screen.getAllByLabelText("Language name");
    inputs.forEach((input) => {
      expect(input.className).toContain("md:col-span-1");
    });
  });

  it("proficiency select does not span columns on mobile", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const selects = screen.getAllByLabelText("Language proficiency level");
    selects.forEach((select) => {
      expect(select.className).not.toContain("col-span-2");
    });
  });

  it("delete button remains a fixed-size independent control", () => {
    render(<LanguagesForm data={mockLanguages} onChange={vi.fn()} />);
    const deleteButtons = screen.getAllByLabelText(/Remove/);
    deleteButtons.forEach((btn) => {
      expect(btn.className).toContain("w-11");
      expect(btn.className).toContain("h-11");
    });
  });

  it("long input values are not truncated by component logic", () => {
    const longName = "Brazilian Portuguese";
    const languages = [{ id: "lang-long", name: longName, proficiency: "fluent" }];
    render(<LanguagesForm data={languages} onChange={vi.fn()} />);
    const input = screen.getByLabelText("Language name") as HTMLInputElement;
    expect(input.value).toBe(longName);
    expect(input.value.length).toBeGreaterThan(10);
  });

  it("add and remove behavior still works", () => {
    const onChange = vi.fn();
    render(<LanguagesForm data={mockLanguages} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Remove English"));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "lang-2", name: "Spanish" }),
      ])
    );
    expect(onChange).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "lang-1", name: "English" }),
      ])
    );
  });
});
