/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExperienceForm } from "@/components/builder/sections/experience-form";
import { EducationForm } from "@/components/builder/sections/education-form";
import { ProjectsForm } from "@/components/builder/sections/projects-form";
import { CertificationsForm } from "@/components/builder/sections/certifications-form";

afterEach(() => cleanup());

// ── FormField unit tests ────────────────────────────────────

describe("FormField", () => {
  it("renders explicit htmlFor unchanged on label", () => {
    render(
      <FormField label="Email" htmlFor="my-email">
        <Input id="my-email" />
      </FormField>,
    );
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "my-email");
  });

  it("error receives expected ID", () => {
    render(
      <FormField label="Name" htmlFor="name-field" error="Required">
        <Input id="name-field" />
      </FormField>,
    );
    const error = screen.getByRole("alert");
    expect(error).toHaveAttribute("id", "name-field-error");
    expect(error).toHaveTextContent("Required");
  });

  it("hint is shown when no error", () => {
    render(
      <FormField label="Pass" htmlFor="pass-field" hint="Min 8 chars">
        <Input id="pass-field" />
      </FormField>,
    );
    expect(screen.getByText("Min 8 chars")).toBeInTheDocument();
  });

  it("hint is hidden when error is present", () => {
    render(
      <FormField label="Pass" htmlFor="pass-err" hint="Min 8 chars" error="Too short">
        <Input id="pass-err" />
      </FormField>,
    );
    expect(screen.getByText("Too short")).toBeInTheDocument();
    expect(screen.queryByText("Min 8 chars")).not.toBeInTheDocument();
  });

  it("required indicator renders", () => {
    render(
      <FormField label="Name" htmlFor="req-field" required>
        <Input id="req-field" />
      </FormField>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not add unexpected props to child", () => {
    render(
      <FormField label="Test" htmlFor="test-child">
        <Input id="test-child" />
      </FormField>,
    );
    const input = screen.getByLabelText("Test");
    expect(input).toHaveAttribute("id", "test-child");
  });
});

// ── Experience form labels ──────────────────────────────────

const noop = () => {};
const mockOnAiImprove = async () => ({ accomplishments: [], skills: [] });

function makeExp(idx: number) {
  return {
    id: `exp-${idx}`,
    company: `Co${idx}`,
    title: `Ti${idx}`,
    employmentType: "full-time",
    location: "SF",
    startDate: "2024-01",
    endDate: null,
    isCurrent: false,
    description: "",
    accomplishments: [],
    skills: [],
  };
}

describe("ExperienceForm labels", () => {
  it("Company label focuses company input", async () => {
    const user = userEvent.setup();
    render(
      <ExperienceForm data={[makeExp(0)]} onChange={noop} onAiImprove={mockOnAiImprove} />,
    );
    // Find the label for "Company" and its associated input
    const labels = screen.getAllByText("Company");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input).toBeTruthy();
    await user.click(label);
    expect(input).toHaveFocus();
  });

  it("Job title label focuses title input", async () => {
    const user = userEvent.setup();
    render(
      <ExperienceForm data={[makeExp(0)]} onChange={noop} onAiImprove={mockOnAiImprove} />,
    );
    const labels = screen.getAllByText("Job Title");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input).toBeTruthy();
    await user.click(label);
    expect(input).toHaveFocus();
  });

  it("two entries produce unique IDs", () => {
    render(
      <ExperienceForm data={[makeExp(0), makeExp(1)]} onChange={noop} onAiImprove={mockOnAiImprove} />,
    );
    // Each entry card has its own set of labeled inputs
    const labels = screen.getAllByText("Company");
    const companyLabels = labels.filter((el) => el.tagName === "LABEL");
    expect(companyLabels).toHaveLength(2);
    const id0 = companyLabels[0].getAttribute("for")!;
    const id1 = companyLabels[1].getAttribute("for")!;
    expect(id0).not.toBe(id1);
    expect(id0).toContain("exp-0");
    expect(id1).toContain("exp-1");
  });

  it("error input has aria-invalid", () => {
    render(
      <ExperienceForm
        data={[makeExp(0)]}
        onChange={noop}
        onAiImprove={mockOnAiImprove}
        errors={{ "0.title": "Title is required" }}
      />,
    );
    const labels = screen.getAllByText("Job Title");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("error is referenced by aria-describedby", () => {
    render(
      <ExperienceForm
        data={[makeExp(0)]}
        onChange={noop}
        onAiImprove={mockOnAiImprove}
        errors={{ "0.company": "Company is required" }}
      />,
    );
    const labels = screen.getAllByText("Company");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toHaveTextContent("Company is required");
  });
});

// ── Education form labels ───────────────────────────────────

function makeEdu(idx: number) {
  return {
    id: `edu-${idx}`,
    university: `Uni${idx}`,
    degree: `Deg${idx}`,
    fieldOfStudy: "",
    location: "",
    startDate: "2023-09",
    endDate: null,
    isCurrent: false,
    grade: "",
    description: "",
    achievements: [],
  };
}

describe("EducationForm labels", () => {
  it("label/input association works", async () => {
    const user = userEvent.setup();
    render(<EducationForm data={[makeEdu(0)]} onChange={noop} />);
    const labels = screen.getAllByText("Institution");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input).toBeTruthy();
    await user.click(label);
    expect(input).toHaveFocus();
  });

  it("repeated IDs are unique", () => {
    render(<EducationForm data={[makeEdu(0), makeEdu(1)]} onChange={noop} />);
    const labels = screen.getAllByText("Institution");
    const institutionLabels = labels.filter((el) => el.tagName === "LABEL");
    expect(institutionLabels).toHaveLength(2);
    const id0 = institutionLabels[0].getAttribute("for")!;
    const id1 = institutionLabels[1].getAttribute("for")!;
    expect(id0).not.toBe(id1);
  });

  it("error semantics: aria-invalid and aria-describedby", () => {
    render(
      <EducationForm
        data={[makeEdu(0)]}
        onChange={noop}
        errors={{ "0.university": "Required" }}
      />,
    );
    const labels = screen.getAllByText("Institution");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("Required");
  });
});

// ── Projects form labels ────────────────────────────────────

function makeProj(idx: number) {
  return {
    id: `proj-${idx}`,
    title: `Proj${idx}`,
    role: "",
    description: "",
    technologies: [],
    url: "",
    liveUrl: "",
    gitUrl: "",
    startDate: "",
    endDate: null,
  };
}

describe("ProjectsForm labels", () => {
  it("label/input association works", async () => {
    const user = userEvent.setup();
    render(<ProjectsForm data={[makeProj(0)]} onChange={noop} />);
    const labels = screen.getAllByText("Project Name");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input).toBeTruthy();
    await user.click(label);
    expect(input).toHaveFocus();
  });

  it("URL and date IDs are unique across entries", () => {
    render(<ProjectsForm data={[makeProj(0), makeProj(1)]} onChange={noop} />);
    const labels = screen.getAllByText("Project URL");
    const urlLabels = labels.filter((el) => el.tagName === "LABEL");
    expect(urlLabels).toHaveLength(2);
    const id0 = urlLabels[0].getAttribute("for")!;
    const id1 = urlLabels[1].getAttribute("for")!;
    expect(id0).not.toBe(id1);
  });

  it("error semantics", () => {
    render(
      <ProjectsForm
        data={[makeProj(0)]}
        onChange={noop}
        errors={{ "0.title": "Required" }}
      />,
    );
    const labels = screen.getAllByText("Project Name");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy!)).toHaveTextContent("Required");
  });
});

// ── Certifications form labels ──────────────────────────────

function makeCert(idx: number) {
  return {
    id: `cert-${idx}`,
    name: `Cert${idx}`,
    issuingOrganisation: "",
    url: "",
    credentialId: "",
    startDate: "2024-06",
    endDate: null,
    doesNotExpire: false,
  };
}

describe("CertificationsForm labels", () => {
  it("label/input association works", async () => {
    const user = userEvent.setup();
    render(<CertificationsForm data={[makeCert(0)]} onChange={noop} />);
    const labels = screen.getAllByText("Certification Name");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input).toBeTruthy();
    await user.click(label);
    expect(input).toHaveFocus();
  });

  it("repeated IDs are unique", () => {
    render(<CertificationsForm data={[makeCert(0), makeCert(1)]} onChange={noop} />);
    const labels = screen.getAllByText("Certification Name");
    const certLabels = labels.filter((el) => el.tagName === "LABEL");
    expect(certLabels).toHaveLength(2);
    const id0 = certLabels[0].getAttribute("for")!;
    const id1 = certLabels[1].getAttribute("for")!;
    expect(id0).not.toBe(id1);
  });

  it("error semantics", () => {
    render(
      <CertificationsForm
        data={[makeCert(0)]}
        onChange={noop}
        errors={{ "0.name": "Required" }}
      />,
    );
    const labels = screen.getAllByText("Certification Name");
    const label = labels.find((el) => el.tagName === "LABEL")!;
    const inputId = label.getAttribute("for")!;
    const input = document.getElementById(inputId) as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy!)).toHaveTextContent("Required");
  });
});
