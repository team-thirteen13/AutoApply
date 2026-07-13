"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle2,
  Loader2,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuilderHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  completionPercentage: number;
  isSaving: boolean;
  lastSaved: string | null;
  onSave: () => void;
  onSaveAndPreview: () => void;
  onOpenHistory: () => void;
  versionCount: number;
  historyButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function BuilderHeader({
  title,
  onTitleChange,
  completionPercentage,
  isSaving,
  lastSaved,
  onSave,
  onSaveAndPreview,
  onOpenHistory,
  versionCount,
  historyButtonRef,
}: BuilderHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="max-w-xs border-none bg-transparent text-lg font-semibold text-slate-900 focus:outline-none focus:ring-0"
            placeholder="Untitled Resume"
            aria-label="Resume title"
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Completion */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500">
              {completionPercentage}%
            </span>
          </div>

          {/* Save status */}
          {lastSaved && (
            <span className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Saved {lastSaved}
            </span>
          )}

          {/* Actions */}
          <Button
            ref={historyButtonRef}
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            aria-label={`Version history (${versionCount} version${versionCount !== 1 ? "s" : ""})`}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
            {versionCount > 0 && (
              <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                {versionCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            aria-label={isSaving ? "Saving..." : "Save resume"}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={onSaveAndPreview}
            disabled={isSaving}
            aria-label="Save and preview resume"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
