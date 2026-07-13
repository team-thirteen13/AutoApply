"use client";

import { useState, useCallback } from "react";
import { Pencil, X } from "lucide-react";
import type { Profile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { CompletenessIndicator } from "./completeness-indicator";

// ── Validation helpers ────────────────────────────────────

const URL_FIELDS = ["githubUrl", "linkedinUrl", "portfolioUrl", "imageUrl"] as const;
const REQUIRED_FIELDS = ["name", "phone", "location"] as const;

type FormErrors = Partial<Record<keyof Profile, string>>;

function validateForm(form: Record<string, string>): FormErrors {
  const errors: FormErrors = {};

  for (const field of REQUIRED_FIELDS) {
    if (!form[field]?.trim()) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  }

  for (const field of URL_FIELDS) {
    const value = form[field];
    if (value && value.trim()) {
      try {
        new URL(value);
      } catch {
        errors[field] = "Invalid URL format";
      }
    }
  }

  return errors;
}

// ── Profile Form Component ────────────────────────────────

interface ProfileFormProps {
  initialProfile: Profile;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [form, setForm] = useState({
    name: initialProfile.name,
    phone: initialProfile.phone,
    location: initialProfile.location,
    githubUrl: initialProfile.githubUrl ?? "",
    linkedinUrl: initialProfile.linkedinUrl ?? "",
    portfolioUrl: initialProfile.portfolioUrl ?? "",
    tagline: initialProfile.tagline ?? "",
    bio: initialProfile.bio ?? "",
    imageUrl: initialProfile.imageUrl ?? "",
  });

  const handleChange = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error when user types
      if (errors[field as keyof Profile]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const handleCancel = useCallback(() => {
    // Reset form to initial values
    setForm({
      name: initialProfile.name,
      phone: initialProfile.phone,
      location: initialProfile.location,
      githubUrl: initialProfile.githubUrl ?? "",
      linkedinUrl: initialProfile.linkedinUrl ?? "",
      portfolioUrl: initialProfile.portfolioUrl ?? "",
      tagline: initialProfile.tagline ?? "",
      bio: initialProfile.bio ?? "",
      imageUrl: initialProfile.imageUrl ?? "",
    });
    setErrors({});
    setIsEditing(false);
  }, [initialProfile]);

  const handleSave = useCallback(async () => {
    // Client-side validation
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Build partial update payload (only changed fields)
      const payload: Record<string, string | null> = {};
      if (form.name !== initialProfile.name) payload.name = form.name;
      if (form.phone !== initialProfile.phone) payload.phone = form.phone;
      if (form.location !== initialProfile.location) payload.location = form.location;
      if (form.githubUrl !== (initialProfile.githubUrl ?? ""))
        payload.githubUrl = form.githubUrl || null;
      if (form.linkedinUrl !== (initialProfile.linkedinUrl ?? ""))
        payload.linkedinUrl = form.linkedinUrl || null;
      if (form.portfolioUrl !== (initialProfile.portfolioUrl ?? ""))
        payload.portfolioUrl = form.portfolioUrl || null;
      if (form.tagline !== (initialProfile.tagline ?? ""))
        payload.tagline = form.tagline || null;
      if (form.bio !== (initialProfile.bio ?? ""))
        payload.bio = form.bio || null;
      if (form.imageUrl !== (initialProfile.imageUrl ?? ""))
        payload.imageUrl = form.imageUrl || null;

      // If nothing changed, just exit edit mode
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        setToast({ message: "No changes to save", type: "info" });
        return;
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Server validation errors are form-level (we don't know which field)
        // Client-side Zod field errors are shown inline via setErrors above
        setToast({
          message: result.error?.message ?? "Failed to update profile",
          type: "error",
        });
        return;
      }

      // Update local state with saved data
      const saved = result.data;
      setForm({
        name: saved.name,
        phone: saved.phone,
        location: saved.location,
        githubUrl: saved.githubUrl ?? "",
        linkedinUrl: saved.linkedinUrl ?? "",
        portfolioUrl: saved.portfolioUrl ?? "",
        tagline: saved.tagline ?? "",
        bio: saved.bio ?? "",
        imageUrl: saved.imageUrl ?? "",
      });

      setIsEditing(false);
      setToast({ message: "Profile updated successfully", type: "success" });
    } catch {
      setToast({
        message: "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [form, initialProfile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && isEditing) {
        handleCancel();
      }
    },
    [isEditing, handleCancel],
  );

  // Build profile snapshot for completeness calculation
  const profileSnapshot: Pick<
    Profile,
    | "name"
    | "email"
    | "phone"
    | "location"
    | "githubUrl"
    | "linkedinUrl"
    | "portfolioUrl"
  > = {
    name: form.name,
    email: initialProfile.email,
    phone: form.phone,
    location: form.location,
    githubUrl: form.githubUrl || null,
    linkedinUrl: form.linkedinUrl || null,
    portfolioUrl: form.portfolioUrl || null,
  };

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      {/* Completeness Indicator */}
      <CompletenessIndicator profile={profileSnapshot} />

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Personal Information
          </h2>
          {!isEditing ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>

        {/* Form */}
        <div className="p-6">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Full Name"
                  htmlFor="name"
                  required
                  error={errors.name}
                >
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="John Doe"
                  />
                </FormField>

                <FormField
                  label="Email"
                  htmlFor="email"
                  hint="Auto-filled from account"
                >
                  <Input
                    id="email"
                    type="email"
                    value={initialProfile.email}
                    disabled
                    className="bg-slate-50 text-slate-500"
                  />
                </FormField>

                <FormField
                  label="Phone"
                  htmlFor="phone"
                  required
                  error={errors.phone}
                >
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                </FormField>

                <FormField
                  label="Location"
                  htmlFor="location"
                  required
                  error={errors.location}
                >
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="LinkedIn URL"
                  htmlFor="linkedinUrl"
                  error={errors.linkedinUrl}
                  hint="Optional"
                >
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) =>
                      handleChange("linkedinUrl", e.target.value)
                    }
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </FormField>

                <FormField
                  label="GitHub URL"
                  htmlFor="githubUrl"
                  error={errors.githubUrl}
                  hint="Optional"
                >
                  <Input
                    id="githubUrl"
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => handleChange("githubUrl", e.target.value)}
                    placeholder="https://github.com/johndoe"
                  />
                </FormField>

                <FormField
                  label="Portfolio URL"
                  htmlFor="portfolioUrl"
                  error={errors.portfolioUrl}
                  hint="Optional"
                >
                  <Input
                    id="portfolioUrl"
                    type="url"
                    value={form.portfolioUrl}
                    onChange={(e) =>
                      handleChange("portfolioUrl", e.target.value)
                    }
                    placeholder="https://johndoe.dev"
                  />
                </FormField>

                <FormField
                  label="Tagline"
                  htmlFor="tagline"
                  hint="Optional"
                >
                  <Input
                    id="tagline"
                    value={form.tagline}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="Senior Software Engineer"
                  />
                </FormField>
              </div>

              <FormField label="Bio" htmlFor="bio" hint="Optional">
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </FormField>

              <FormField label="Image URL" htmlFor="imageUrl" hint="Optional">
                <Input
                  id="imageUrl"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
              </FormField>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Full Name
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {form.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {initialProfile.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {form.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {form.location || "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    LinkedIn
                  </p>
                  <p className="mt-1 text-sm text-slate-900 truncate">
                    {form.linkedinUrl || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    GitHub
                  </p>
                  <p className="mt-1 text-sm text-slate-900 truncate">
                    {form.githubUrl || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Portfolio
                  </p>
                  <p className="mt-1 text-sm text-slate-900 truncate">
                    {form.portfolioUrl || "—"}
                  </p>
                </div>
              </div>

              {form.tagline && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Tagline
                  </p>
                  <p className="mt-1 text-sm text-slate-900">{form.tagline}</p>
                </div>
              )}

              {form.bio && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Bio
                  </p>
                  <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">
                    {form.bio}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
