// ─────────────────────────────────────────────────────────────
// Landing Layout
// ─────────────────────────────────────────────────────────────
// Server component wrapper for landing page sections.
// Provides consistent layout structure.
// ─────────────────────────────────────────────────────────────

interface LandingLayoutProps {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return <div className="min-h-screen">{children}</div>;
}
