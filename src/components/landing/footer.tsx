// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────
// Landing page footer with 4-column link layout, dynamic
// copyright year, and a gradient transition from content.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Features", href: "/pricing" },
    { label: "Pricing", href: "/pricing" },
  ],
  resources: [
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/help" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
} as const;

const columnHeadings: Record<keyof typeof footerLinks, string> = {
  product: "Product",
  resources: "Resources",
  company: "Company",
  legal: "Legal",
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Gradient transition from content to footer */}
      <div className="bg-gradient-to-b from-transparent to-gray-900 h-24" />

      <footer
        role="contentinfo"
        className="bg-gray-900 text-gray-300 py-12"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 4-column link grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                  {columnHeadings[category as keyof typeof footerLinks]}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
            <p>
              &copy; {currentYear} AutoApply. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0 flex gap-4">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
