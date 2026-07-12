"use client";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { ResumeSnapshot } from "@/types/resume";

interface PersonalInfoFormProps {
  data: ResumeSnapshot["profile"];
  onChange: (data: ResumeSnapshot["profile"]) => void;
  errors: Record<string, string>;
}

export function PersonalInfoForm({
  data,
  onChange,
  errors,
}: PersonalInfoFormProps) {
  const update = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Tell us about yourself. This information will appear at the top of
          your resume.
        </p>
      </div>

      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
          {data?.name
            ? data.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "?"}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">
            Profile Photo
          </p>
          <p className="text-xs text-slate-400">
            Auto-generated from your initials
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Resume Title" htmlFor="title" required error={errors.title}>
          <Input
            id="title"
            value={data?.tagline ?? ""}
            onChange={(e) => update("tagline", e.target.value)}
            placeholder="e.g. Senior Software Engineer"
          />
        </FormField>

        <FormField label="Full Name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            value={data?.name ?? ""}
            onChange={(e) => update("name", e.target.value)}
            placeholder="John Doe"
          />
        </FormField>

        <FormField label="Professional Title" htmlFor="profTitle">
          <Input
            id="profTitle"
            value={data?.title ?? ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Software Engineer"
          />
        </FormField>

        <FormField label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            value={data?.email ?? ""}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@example.com"
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            value={data?.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 234 567 890"
          />
        </FormField>

        <FormField label="City" htmlFor="city">
          <Input
            id="city"
            value={data?.city ?? data?.location ?? ""}
            onChange={(e) => {
              update("city", e.target.value);
              update("location", e.target.value);
            }}
            placeholder="San Francisco"
          />
        </FormField>

        <FormField label="Country" htmlFor="country">
          <Input
            id="country"
            value={data?.country ?? ""}
            onChange={(e) => update("country", e.target.value)}
            placeholder="United States"
          />
        </FormField>

        <FormField label="Full Address" htmlFor="address" hint="Optional">
          <Input
            id="address"
            value={data?.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
            placeholder="123 Main St, Apt 4"
          />
        </FormField>

        <FormField label="LinkedIn URL" htmlFor="linkedin" hint="Optional">
          <Input
            id="linkedin"
            type="url"
            value={data?.linkedinUrl ?? ""}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/johndoe"
          />
        </FormField>

        <FormField label="Portfolio URL" htmlFor="portfolio" hint="Optional">
          <Input
            id="portfolio"
            type="url"
            value={data?.portfolioUrl ?? ""}
            onChange={(e) => update("portfolioUrl", e.target.value)}
            placeholder="https://johndoe.dev"
          />
        </FormField>

        <FormField label="GitHub URL" htmlFor="github" hint="Optional">
          <Input
            id="github"
            type="url"
            value={data?.githubUrl ?? ""}
            onChange={(e) => update("githubUrl", e.target.value)}
            placeholder="https://github.com/johndoe"
          />
        </FormField>
      </div>
    </div>
  );
}
