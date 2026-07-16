"use client";

import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ResumeSnapshot } from "@/types/resume";
import { toMonthInputValue, fromMonthInputValue } from "@/lib/date-normalize";

type Certification = NonNullable<ResumeSnapshot["certificates"]>[number];

interface CertificationsFormProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
  errors?: Record<string, string>;
}

export function CertificationsForm({
  data,
  onChange,
  errors,
}: CertificationsFormProps) {
  const addEntry = () => {
    onChange([
      ...data,
      {
        id: crypto.randomUUID(),
        name: "",
        issuingOrganisation: "",
        url: "",
        credentialId: "",
        startDate: "",
        endDate: null,
        doesNotExpire: false,
      },
    ]);
  };

  const removeEntry = (idx: number) => {
    onChange(data.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: string, value: unknown) => {
    const updated = [...data];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const moveEntry = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= data.length) return;
    const updated = [...data];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange(updated);
  };

  const duplicateEntry = (idx: number) => {
    const clone = { ...data[idx], id: crypto.randomUUID() };
    const updated = [...data];
    updated.splice(idx + 1, 0, clone);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Certifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add professional certifications and credentials.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={addEntry}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {data.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">
            No certifications added yet.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={addEntry}
            className="mt-3"
          >
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </div>
      )}

      {data.map((cert, idx) => (
        <div
          key={cert.id ?? idx}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {cert.name || "New Certification"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveEntry(idx, -1)}
                disabled={idx === 0}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveEntry(idx, 1)}
                disabled={idx === data.length - 1}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => duplicateEntry(idx)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeEntry(idx)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Certification Name" htmlFor={`cert-${idx}-name`} required error={errors?.[`${idx}.name`]}>
              <Input
                id={`cert-${idx}-name`}
                value={cert.name}
                onChange={(e) => updateEntry(idx, "name", e.target.value)}
                placeholder="AWS Solutions Architect"
                aria-invalid={Boolean(errors?.[`${idx}.name`])}
                aria-describedby={errors?.[`${idx}.name`] ? `cert-${idx}-name-error` : undefined}
              />
            </FormField>

            <FormField label="Issuing Organisation" htmlFor={`cert-${idx}-org`}>
              <Input
                id={`cert-${idx}-org`}
                value={cert.issuingOrganisation ?? ""}
                onChange={(e) =>
                  updateEntry(idx, "issuingOrganisation", e.target.value)
                }
                placeholder="Amazon Web Services"
              />
            </FormField>

            <FormField label="Issue Date" htmlFor={`cert-${idx}-startDate`} required error={errors?.[`${idx}.startDate`]}>
              <Input
                id={`cert-${idx}-startDate`}
                type="month"
                value={toMonthInputValue(cert.startDate)}
                onChange={(e) =>
                  updateEntry(idx, "startDate", fromMonthInputValue(e.target.value))
                }
                aria-invalid={Boolean(errors?.[`${idx}.startDate`])}
                aria-describedby={errors?.[`${idx}.startDate`] ? `cert-${idx}-startDate-error` : undefined}
              />
            </FormField>

            <FormField label="Expiry Date" htmlFor={`cert-${idx}-endDate`} error={errors?.[`${idx}.endDate`]}>
              <Input
                id={`cert-${idx}-endDate`}
                type="month"
                value={toMonthInputValue(cert.endDate)}
                onChange={(e) =>
                  updateEntry(idx, "endDate", fromMonthInputValue(e.target.value))
                }
                disabled={cert.doesNotExpire}
                aria-invalid={Boolean(errors?.[`${idx}.endDate`])}
                aria-describedby={errors?.[`${idx}.endDate`] ? `cert-${idx}-endDate-error` : undefined}
              />
            </FormField>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cert.doesNotExpire ?? false}
                  onChange={(e) =>
                    updateEntry(idx, "doesNotExpire", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Does not expire
                </span>
              </label>
            </div>

            <FormField label="Credential ID" htmlFor={`cert-${idx}-credentialId`} hint="Optional">
              <Input
                id={`cert-${idx}-credentialId`}
                value={cert.credentialId ?? ""}
                onChange={(e) =>
                  updateEntry(idx, "credentialId", e.target.value)
                }
                placeholder="ABC123DEF456"
              />
            </FormField>

            <FormField label="Credential URL" htmlFor={`cert-${idx}-url`} hint="Optional">
              <Input
                id={`cert-${idx}-url`}
                type="url"
                value={cert.url ?? ""}
                onChange={(e) => updateEntry(idx, "url", e.target.value)}
                placeholder="https://www.credential.net/..."
              />
            </FormField>
          </div>
        </div>
      ))}

      {/* Validation errors */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
          {Object.entries(errors).map(([key, msg]) => (
            <p key={key} className="text-sm text-red-600">{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}
