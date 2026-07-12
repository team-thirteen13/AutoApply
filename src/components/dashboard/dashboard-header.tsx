"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, FileText } from "lucide-react";
import { useActionState } from "react";
import { logout } from "@/app/dashboard/actions";

interface DashboardHeaderProps {
  email: string;
}

export function DashboardHeader({ email }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [, formAction, isPending] = useActionState(logout, null);

  const initials = email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard", label: "My Resumes", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-md shadow-blue-500/20">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            ApplyAI
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white shadow-sm">
              {initials}
            </div>
            <span className="text-sm font-medium text-slate-700">{email}</span>
          </div>
          <form action={formAction}>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isPending ? "Signing out..." : "Logout"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
