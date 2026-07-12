"use client";

import { useState } from "react";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface SummaryFormProps {
  data: string;
  onChange: (data: string) => void;
  onAiImprove: (text: string) => Promise<string>;
}

export function SummaryForm({ data, onChange, onAiImprove }: SummaryFormProps) {
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 500;
  const suggestedMin = 100;

  const handleImprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onAiImprove(data);
      setImproved(result);
    } catch {
      setError("Failed to improve summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const acceptImprovement = () => {
    if (improved) {
      onChange(improved);
      setImproved(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Professional Summary
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Write a compelling summary that highlights your key qualifications
          and career goals.
        </p>
      </div>

      <FormField
        label="Summary"
        htmlFor="summary"
        hint={`${data.length}/${maxChars} characters · Recommended: ${suggestedMin}+ characters`}
      >
        <Textarea
          id="summary"
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications..."
          rows={6}
          maxLength={maxChars}
        />
      </FormField>

      {/* AI Improve */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-violet-900">
              AI-Powered Improvement
            </p>
            <p className="text-xs text-violet-600/70">
              Let our AI polish your summary for maximum impact
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleImprove}
            disabled={loading || !data.trim()}
            className="border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Improving..." : "AI Improve"}
          </Button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}

        {improved && (
          <div className="mt-3 rounded-lg border border-violet-200 bg-white p-3">
            <p className="mb-2 text-xs font-medium text-violet-700">
              Improved version:
            </p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {improved}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={acceptImprovement}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setImproved(null)}
              >
                <X className="h-3.5 w-3.5" />
                Keep Original
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
