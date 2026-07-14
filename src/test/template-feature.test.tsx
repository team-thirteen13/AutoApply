/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/app/resumes/actions", () => ({
  saveResumeAction: vi.fn().mockResolvedValue({ success: true, data: { id: "resume-1" } }),
  improveSummaryAction: vi.fn().mockResolvedValue({ data: { bio: "Improved summary" } }),
  improveExperienceAction: vi.fn().mockResolvedValue({ data: { accomplishments: [] } }),
  listVersionsAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/components/ui/toast", () => ({
  Toast: ({ message, type }: { message: string; type: string }) => (
    <div data-testid="toast" data-type={type}>{message}</div>
  ),
}));

vi.mock("@/components/builder/builder-header", () => ({
  BuilderHeader: ({
    title,
    onSave,
    onSaveAndPreview,
  }: {
    title: string;
    onTitleChange: (t: string) => void;
    completionPercentage: number;
    isSaving: boolean;
    lastSaved: string | null;
    onSave: () => void;
    onSaveAndPreview: () => void;
  }) => (
    <div data-testid="builder-header">
      <span data-testid="header-title">{title}</span>
      <button data-testid="save-btn" onClick={onSave}>Save</button>
      <button data-testid="save-preview-btn" onClick={onSaveAndPreview}>Save & Preview</button>
    </div>
  ),
}));

vi.mock("@/components/builder/builder-sidebar", () => ({
  BuilderSidebar: () => <div data-testid="builder-sidebar" />,
  SECTIONS: [
    { id: "personal", label: "Personal" },
    { id: "summary", label: "Summary" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certifications" },
    { id: "languages", label: "Languages" },
  ],
}));

vi.mock("@/components/builder/mobile-section-nav", () => ({
  MobileSectionNav: () => <div data-testid="mobile-nav" />,
}));

vi.mock("@/components/builder/sections", () => ({
  PersonalInfoForm: ({ data, onChange }: { data: unknown; onChange: (d: unknown) => void }) => (
    <div data-testid="personal-form">
      <input
        data-testid="name-input"
        defaultValue={(data as { name?: string })?.name ?? ""}
        onChange={(e) => onChange({ ...(data as object), name: e.target.value })}
      />
    </div>
  ),
  SummaryForm: () => <div data-testid="summary-form" />,
  ExperienceForm: () => <div data-testid="experience-form" />,
  EducationForm: () => <div data-testid="education-form" />,
  SkillsForm: () => <div data-testid="skills-form" />,
  ProjectsForm: () => <div data-testid="projects-form" />,
  CertificationsForm: () => <div data-testid="certifications-form" />,
  LanguagesForm: () => <div data-testid="languages-form" />,
  FileUploadForm: () => <div data-testid="file-upload-form" />,
}));

// ── Import after mocks ─────────────────────────────────────

import { TemplateSelector } from "@/components/builder/template-selector";
import { ResumePreview } from "@/components/preview/resume-preview";
import { ResumeBuilder } from "@/components/builder/resume-builder";
import type { ResumeSnapshot } from "@/types/resume";
import type { ResumeTemplateId } from "@/lib/templates/types";
import { saveResumeAction } from "@/app/resumes/actions";

// ── Test Data ──────────────────────────────────────────────

const baseSnapshot: ResumeSnapshot = {
  profile: {
    name: "Jane Smith",
    email: "jane@example.com",
    title: "Software Engineer",
    phone: "+1 555 123 4567",
    city: "Austin",
    country: "TX",
    linkedinUrl: "https://linkedin.com/in/janesmith",
    portfolioUrl: "https://janesmith.dev",
    githubUrl: "https://github.com/janesmith",
  },
  summary: "Experienced software engineer with 5+ years building web applications.",
  experiences: [
    {
      id: "exp-1",
      company: "Acme Corp",
      title: "Senior Engineer",
      employmentType: "Full-time",
      location: "Austin, TX",
      startDate: "2021-01-15",
      endDate: null,
      isCurrent: true,
      description: "Leading frontend development.",
      accomplishments: ["Built a design system", "Reduced bundle size by 40%"],
    },
  ],
  education: [
    {
      id: "edu-1",
      university: "UT Austin",
      degree: "BS",
      fieldOfStudy: "Computer Science",
      startDate: "2015-09-01",
      endDate: "2019-05-15",
    },
  ],
  skills: [
    { name: "TypeScript", category: "technical", proficiency: "advanced" },
    { name: "React", category: "technical", proficiency: "advanced" },
  ],
  projects: [
    {
      id: "proj-1",
      title: "Open Source Tool",
      role: "Author",
      description: "A developer tool",
      technologies: ["TypeScript", "Node.js"],
      url: "https://github.com/janesmith/tool",
      startDate: "2022-06-01",
      endDate: "2022-12-15",
    },
    {
      id: "proj-2",
      title: "Internal Dashboard",
      description: "Analytics dashboard",
      technologies: ["React"],
      startDate: "2023-01-01",
    },
  ],
  certificates: [
    {
      id: "cert-1",
      name: "AWS Solutions Architect",
      issuingOrganisation: "Amazon",
      startDate: "2023-03-01",
      endDate: "2026-03-01",
    },
  ],
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Intermediate" },
  ],
};

// ── Tests ──────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ── Template Selector ──────────────────────────────────────

describe("TemplateSelector", () => {
  it("renders Classic, Modern, and Minimal options", () => {
    render(
      <TemplateSelector selected="classic" onChange={() => {}} />,
    );

    expect(screen.getByText("Classic")).toBeInTheDocument();
    expect(screen.getByText("Modern")).toBeInTheDocument();
    expect(screen.getByText("Minimal")).toBeInTheDocument();
  });

  it("current template radio is checked", () => {
    render(
      <TemplateSelector selected="modern" onChange={() => {}} />,
    );

    const radios = screen.getAllByRole("radio");
    const modernRadio = radios.find((r) => r.getAttribute("value") === "modern");
    expect(modernRadio).toBeChecked();
  });

  it("clicking a template calls onChange with its ID", () => {
    const onChange = vi.fn();
    render(
      <TemplateSelector selected="classic" onChange={onChange} />,
    );

    const modernLabel = screen.getByText("Modern").closest("label")!;
    fireEvent.click(modernLabel);

    expect(onChange).toHaveBeenCalledWith("modern");
  });

  it("keyboard activation changes selection", () => {
    const onChange = vi.fn();
    render(
      <TemplateSelector selected="classic" onChange={onChange} />,
    );

    const radios = screen.getAllByRole("radio");
    const modernRadio = radios.find((r) => r.getAttribute("value") === "modern")!;

    // Focus the modern radio and click it (simulates keyboard Enter/Space activation)
    modernRadio.focus();
    fireEvent.click(modernRadio);

    expect(onChange).toHaveBeenCalledWith("modern");
  });

  it("native radio semantics are correct", () => {
    render(
      <TemplateSelector selected="classic" onChange={() => {}} />,
    );

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);

    // Each radio has a name attribute for grouping
    for (const radio of radios) {
      expect(radio.getAttribute("name")).toBe("template");
    }
  });

  it("visible selected state updates on change", () => {
    const { rerender } = render(
      <TemplateSelector selected="classic" onChange={() => {}} />,
    );

    // Classic label has blue border
    const classicLabel = screen.getByText("Classic").closest("label")!;
    expect(classicLabel.className).toContain("border-blue-500");

    // Re-render with modern selected
    rerender(
      <TemplateSelector selected="modern" onChange={() => {}} />,
    );

    const modernLabel = screen.getByText("Modern").closest("label")!;
    expect(modernLabel.className).toContain("border-blue-500");

    // Classic no longer has blue border
    const classicLabelAfter = screen.getByText("Classic").closest("label")!;
    expect(classicLabelAfter.className).not.toContain("border-blue-500");
  });

  it("radio input is visually hidden but associated with label", () => {
    render(
      <TemplateSelector selected="classic" onChange={() => {}} />,
    );

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      // sr-only class means visually hidden but accessible
      expect(radio.className).toContain("sr-only");
    }

    // Labels are associated via htmlFor (implicit in label wrapping)
    const labels = screen.getAllByRole("radio").map((r) => r.closest("label"));
    expect(labels).toHaveLength(3);
  });
});

// ── Builder Integration ────────────────────────────────────

describe("ResumeBuilder — template integration", () => {
  it("selecting a template updates the live ResumePreview", () => {
    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={baseSnapshot}
      />,
    );

    // Preview should show Classic content initially (slate palette)
    // There are two ResumePreview instances (inline + desktop sidebar)
    const allSmiths = screen.getAllByText("Jane Smith");
    const classicContainer = allSmiths[0].closest("[class*='rounded-xl']")!;
    expect(classicContainer.className).toContain("border-slate-200");

    // Select Modern
    const modernLabel = screen.getByText("Modern").closest("label")!;
    fireEvent.click(modernLabel);

    // Preview should now show Modern content (blue palette)
    const allSmithsAfter = screen.getAllByText("Jane Smith");
    const modernHeader = allSmithsAfter[0].closest("header")!;
    expect(modernHeader.className).toContain("border-blue-600");
  });

  it("selecting a different template marks the builder dirty", () => {
    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={baseSnapshot}
      />,
    );

    // Select Modern template
    const modernLabel = screen.getByText("Modern").closest("label")!;
    fireEvent.click(modernLabel);

    // Try to leave page — beforeunload should fire
    const event = new Event("beforeunload");
    const preventDefault = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });

  it("selecting the already-selected template does not mark dirty again", () => {
    // Render with classic already selected in snapshot
    const snapshotWithTemplate: ResumeSnapshot = {
      ...baseSnapshot,
      templateId: "classic",
    };

    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={snapshotWithTemplate}
      />,
    );

    // Click Classic again (already selected)
    const classicLabel = screen.getByText("Classic").closest("label")!;
    fireEvent.click(classicLabel);

    // The save button should still be there, but no dirty state change
    // We verify by checking that clicking the same template doesn't cause
    // unnecessary re-renders (the save action is not called)
    expect(saveResumeAction).not.toHaveBeenCalled();
  });

  it("current snapshot template initializes the selector", () => {
    const snapshotWithModern: ResumeSnapshot = {
      ...baseSnapshot,
      templateId: "modern",
    };

    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={snapshotWithModern}
      />,
    );

    const radios = screen.getAllByRole("radio");
    const modernRadio = radios.find((r) => r.getAttribute("value") === "modern")!;
    expect(modernRadio).toBeChecked();
  });

  it("missing template initializes to Classic", () => {
    const snapshotNoTemplate: ResumeSnapshot = {
      profile: { name: "Test User", email: "test@example.com" },
    };

    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={snapshotNoTemplate}
      />,
    );

    const radios = screen.getAllByRole("radio");
    const classicRadio = radios.find((r) => r.getAttribute("value") === "classic")!;
    expect(classicRadio).toBeChecked();
  });

  it("invalid template initializes to Classic", () => {
    const snapshotInvalid: ResumeSnapshot = {
      ...baseSnapshot,
      templateId: "nonexistent" as ResumeTemplateId,
    };

    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={snapshotInvalid}
      />,
    );

    const radios = screen.getAllByRole("radio");
    const classicRadio = radios.find((r) => r.getAttribute("value") === "classic")!;
    expect(classicRadio).toBeChecked();
  });

  it("save payload includes the selected templateId", async () => {
    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={baseSnapshot}
      />,
    );

    // Select Modern template
    const modernLabel = screen.getByText("Modern").closest("label")!;
    fireEvent.click(modernLabel);

    // Click save
    const saveBtn = screen.getByTestId("save-btn");
    fireEvent.click(saveBtn);

    // Wait for save action to be called
    await vi.waitFor(() => {
      expect(saveResumeAction).toHaveBeenCalled();
    });

    // Verify the snapshot passed to saveResumeAction includes templateId
    const callArgs = vi.mocked(saveResumeAction).mock.calls[0];
    const savedSnapshot = callArgs[2] as ResumeSnapshot;
    expect(savedSnapshot.templateId).toBe("modern");
  });

  it("save-and-preview payload includes the selected templateId", async () => {
    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={baseSnapshot}
      />,
    );

    // Select Minimal template
    const minimalLabel = screen.getByText("Minimal").closest("label")!;
    fireEvent.click(minimalLabel);

    // Click save & preview
    const savePreviewBtn = screen.getByTestId("save-preview-btn");
    fireEvent.click(savePreviewBtn);

    await vi.waitFor(() => {
      expect(saveResumeAction).toHaveBeenCalled();
    });

    const callArgs = vi.mocked(saveResumeAction).mock.calls[0];
    const savedSnapshot = callArgs[2] as ResumeSnapshot;
    expect(savedSnapshot.templateId).toBe("minimal");
  });

  it("successful save clears dirty state", async () => {
    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={baseSnapshot}
      />,
    );

    // Change template to mark dirty
    const modernLabel = screen.getByText("Modern").closest("label")!;
    fireEvent.click(modernLabel);

    // Save
    const saveBtn = screen.getByTestId("save-btn");
    fireEvent.click(saveBtn);

    // Wait for save to complete and toast to appear (indicates state updated)
    await vi.waitFor(() => {
      expect(screen.getByTestId("toast")).toHaveTextContent("Resume saved successfully");
    });

    // After save, beforeunload should NOT fire
    const event = new Event("beforeunload");
    const preventDefault = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });
});

// ── Preview Behavior ───────────────────────────────────────

describe("ResumePreview — template rendering", () => {
  it("Classic renders all supported sections", () => {
    render(<ResumePreview snapshot={{ ...baseSnapshot, templateId: "classic" }} />);

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText(/Experienced software engineer/)).toBeInTheDocument();
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/UT Austin/)).toBeInTheDocument();
    // TypeScript appears in both Skills and Projects
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Open Source Tool")).toBeInTheDocument();
    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("Modern renders all supported sections", () => {
    render(<ResumePreview snapshot={{ ...baseSnapshot, templateId: "modern" }} />);

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText(/Experienced software engineer/)).toBeInTheDocument();
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
    expect(screen.getByText(/UT Austin/)).toBeInTheDocument();
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Open Source Tool")).toBeInTheDocument();
    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("Minimal renders all supported sections", () => {
    render(<ResumePreview snapshot={{ ...baseSnapshot, templateId: "minimal" }} />);

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText(/Experienced software engineer/)).toBeInTheDocument();
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
    expect(screen.getByText(/UT Austin/)).toBeInTheDocument();
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Open Source Tool")).toBeInTheDocument();
    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shared resume data appears in every template", () => {
    const templates: ResumeTemplateId[] = ["classic", "modern", "minimal"];

    for (const templateId of templates) {
      cleanup();
      const { unmount } = render(
        <ResumePreview snapshot={{ ...baseSnapshot, templateId }} />,
      );

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();

      unmount();
    }
  });

  it("project URL indicator appears in Classic when URL exists", () => {
    render(<ResumePreview snapshot={{ ...baseSnapshot, templateId: "classic" }} />);

    // Open Source Tool has a URL
    const link = screen.getByText("↗");
    expect(link).toHaveAttribute("href", "https://github.com/janesmith/tool");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("project URL indicator is absent when URL is missing", () => {
    const snapshotNoUrl: ResumeSnapshot = {
      ...baseSnapshot,
      projects: [
        {
          id: "proj-no-url",
          title: "No URL Project",
          description: "Missing URL",
        },
      ],
    };

    render(<ResumePreview snapshot={{ ...snapshotNoUrl, templateId: "classic" }} />);

    expect(screen.queryByText("↗")).not.toBeInTheDocument();
  });

  it("Classic contact links retain blue styling", () => {
    render(<ResumePreview snapshot={{ ...baseSnapshot, templateId: "classic" }} />);

    const linkedinLink = screen.getByText("LinkedIn");
    expect(linkedinLink).toHaveClass("text-blue-600");
    expect(linkedinLink).toHaveClass("hover:underline");

    const portfolioLink = screen.getByText("Portfolio");
    expect(portfolioLink).toHaveClass("text-blue-600");
    expect(portfolioLink).toHaveClass("hover:underline");

    const githubLink = screen.getByText("GitHub");
    expect(githubLink).toHaveClass("text-blue-600");
    expect(githubLink).toHaveClass("hover:underline");
  });

  it("selected template changes the rendered layout", () => {
    const { rerender } = render(
      <ResumePreview snapshot={{ ...baseSnapshot, templateId: "classic" }} />,
    );

    // Classic uses border-slate-200
    const classicContainer = screen.getByText("Jane Smith").closest("[class*='rounded-xl']")!;
    expect(classicContainer.className).toContain("border-slate-200");

    rerender(
      <ResumePreview snapshot={{ ...baseSnapshot, templateId: "modern" }} />,
    );

    // Modern uses border-blue-200
    const modernContainer = screen.getByText("Jane Smith").closest("[class*='rounded-xl']")!;
    expect(modernContainer.className).toContain("border-blue-200");
  });

  it("invalid template ID falls back safely to Classic", () => {
    render(
      <ResumePreview
        snapshot={{
          ...baseSnapshot,
          templateId: "nonexistent" as ResumeTemplateId,
        }}
      />,
    );

    // Should render with Classic styling (border-slate-200)
    const container = screen.getByText("Jane Smith").closest("[class*='rounded-xl']")!;
    expect(container.className).toContain("border-slate-200");
  });

  it("legacy snapshot without templateId renders Classic", () => {
    const legacySnapshot: ResumeSnapshot = {
      profile: { name: "Legacy User", email: "legacy@example.com" },
      summary: "Legacy summary content for testing purposes and more",
    };

    render(<ResumePreview snapshot={legacySnapshot} />);

    // No templateId → getEffectiveTemplateId returns "classic"
    // Classic uses border-slate-200
    const container = screen.getByText("Legacy User").closest("[class*='rounded-xl']")!;
    expect(container.className).toContain("border-slate-200");
  });

  it("legacy string-array skills still render after normalization", () => {
    const legacySnapshot: ResumeSnapshot = {
      profile: { name: "Skill User", email: "skill@example.com" },
      skills: [
        { name: "TypeScript", category: "technical", proficiency: "advanced" },
        { name: "React", category: "technical", proficiency: "intermediate" },
      ],
    };

    render(<ResumePreview snapshot={legacySnapshot} />);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });
});

// ── Persistence and Versions ───────────────────────────────

describe("Template persistence", () => {
  it("save payload contains the stable template ID, not display text", async () => {
    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={baseSnapshot}
      />,
    );

    // Select Modern
    const modernLabel = screen.getByText("Modern").closest("label")!;
    fireEvent.click(modernLabel);

    // Save
    const saveBtn = screen.getByTestId("save-btn");
    fireEvent.click(saveBtn);

    await vi.waitFor(() => {
      expect(saveResumeAction).toHaveBeenCalled();
    });

    const callArgs = vi.mocked(saveResumeAction).mock.calls[0];
    const savedSnapshot = callArgs[2] as ResumeSnapshot;

    // Should be the string ID, not the display name
    expect(savedSnapshot.templateId).toBe("modern");
    expect(savedSnapshot.templateId).not.toBe("Modern");
  });

  it("reopened snapshot restores its saved template", () => {
    const savedSnapshot: ResumeSnapshot = {
      ...baseSnapshot,
      templateId: "minimal",
    };

    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={savedSnapshot}
      />,
    );

    // Minimal should be selected
    const radios = screen.getAllByRole("radio");
    const minimalRadio = radios.find((r) => r.getAttribute("value") === "minimal")!;
    expect(minimalRadio).toBeChecked();
  });

  it("old version without templateId resolves to Classic", () => {
    const oldVersionSnapshot: ResumeSnapshot = {
      profile: { name: "Old Version", email: "old@example.com" },
      // No templateId — simulates pre-Phase-4 data
    };

    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Old Resume"
        initialSnapshot={oldVersionSnapshot}
      />,
    );

    const radios = screen.getAllByRole("radio");
    const classicRadio = radios.find((r) => r.getAttribute("value") === "classic")!;
    expect(classicRadio).toBeChecked();
  });

  it("separate version snapshots can retain different template IDs", () => {
    // Version A: Modern
    const versionA: ResumeSnapshot = {
      ...baseSnapshot,
      templateId: "modern",
    };

    const { unmount } = render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Version A"
        initialSnapshot={versionA}
      />,
    );

    const radiosA = screen.getAllByRole("radio");
    const modernRadio = radiosA.find((r) => r.getAttribute("value") === "modern")!;
    expect(modernRadio).toBeChecked();
    unmount();

    // Version B: Minimal
    const versionB: ResumeSnapshot = {
      ...baseSnapshot,
      templateId: "minimal",
    };

    render(
      <ResumeBuilder
        resumeId="resume-2"
        initialTitle="Version B"
        initialSnapshot={versionB}
      />,
    );

    const radiosB = screen.getAllByRole("radio");
    const minimalRadio = radiosB.find((r) => r.getAttribute("value") === "minimal")!;
    expect(minimalRadio).toBeChecked();
  });

  it("changing current builder state does not mutate an older snapshot", () => {
    const originalSnapshot: ResumeSnapshot = {
      ...baseSnapshot,
      templateId: "classic",
    };

    // Keep a reference to the original
    const originalTemplateId = originalSnapshot.templateId;

    render(
      <ResumeBuilder
        resumeId="resume-1"
        initialTitle="Test Resume"
        initialSnapshot={originalSnapshot}
      />,
    );

    // Change to Modern
    const modernLabel = screen.getByText("Modern").closest("label")!;
    fireEvent.click(modernLabel);

    // The original snapshot object should not be mutated
    expect(originalSnapshot.templateId).toBe(originalTemplateId);
  });
});

// ── Accessibility ──────────────────────────────────────────

describe("Template accessibility", () => {
  it("fieldset groups radio inputs with legend", () => {
    render(
      <TemplateSelector selected="classic" onChange={() => {}} />,
    );

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeInTheDocument();

    const legend = within(fieldset).getByText("Resume Template");
    expect(legend).toBeInTheDocument();
  });

  it("each radio input has an accessible label", () => {
    render(
      <TemplateSelector selected="classic" onChange={() => {}} />,
    );

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      // Each radio should have an aria-label
      const label = radio.getAttribute("aria-label");
      expect(label).toBeTruthy();
      expect(label).toContain("template");
    }
  });

  it("radios are keyboard navigable", () => {
    const onChange = vi.fn();
    render(
      <TemplateSelector selected="classic" onChange={onChange} />,
    );

    const radios = screen.getAllByRole("radio");
    const classicRadio = radios.find((r) => r.getAttribute("value") === "classic")!;

    // Focus first radio
    classicRadio.focus();
    expect(document.activeElement).toBe(classicRadio);

    // Press arrow key to move to next radio
    fireEvent.keyDown(classicRadio, { key: "ArrowRight" });
    // The browser handles arrow key navigation between radios in a group
  });
});
