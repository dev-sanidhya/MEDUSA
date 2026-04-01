"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

const navItems = [
  { href: "/", label: "Vision" },
  { href: "/technology", label: "Technology" },
  { href: "/upcoming", label: "Upcoming" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"
    >
      <div
        className={`mx-auto max-w-7xl rounded-full border px-4 transition-all duration-300 sm:px-6 ${
          scrolled || mobileOpen
            ? "border-[rgba(77,29,23,0.12)] bg-[rgba(255,247,241,0.92)] shadow-[0_18px_60px_rgba(105,48,33,0.14)] backdrop-blur-xl"
            : "border-[rgba(77,29,23,0.08)] bg-[rgba(255,248,243,0.72)] backdrop-blur-md"
        }`}
      >
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-2"
          >
            <BrandMark className="h-11 w-11 transition-transform duration-300 group-hover:scale-[1.04]" />
            <div className="leading-none">
              <span
                className="block text-xl font-bold tracking-[0.22em] text-[color:var(--color-ink)]"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                MEDUSA
              </span>
              <span className="block text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-sage)]">
                Face-led beauty
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} active={pathname === item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/try"
              className="group relative hidden overflow-hidden rounded-full border border-[rgba(77,29,23,0.12)] bg-[rgba(158,43,37,0.04)] px-5 py-2.5 transition-all hover:bg-[rgba(158,43,37,0.08)] md:inline-flex"
            >
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-[rgba(158,43,37,0.14)] via-[rgba(201,131,91,0.18)] to-[rgba(110,31,40,0.12)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="relative text-sm font-medium tracking-wide text-[color:var(--color-ink)] transition-colors">
                Try MVP
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(77,29,23,0.12)] bg-[rgba(255,247,241,0.88)] text-[color:var(--color-ink)] md:hidden"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/8 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm transition-colors ${
                    pathname === item.href
                      ? "bg-[rgba(158,43,37,0.08)] text-[color:var(--color-ink)]"
                      : "text-[color:var(--color-ink-soft)] hover:bg-[rgba(158,43,37,0.05)] hover:text-[color:var(--color-ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/try"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-2xl border border-[rgba(77,29,23,0.12)] bg-[rgba(158,43,37,0.06)] px-4 py-3 text-sm text-[color:var(--color-ink)]"
              >
                Try MVP
              </Link>
            </nav>
          </div>
        )}
      </div>
    </motion.header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative text-sm tracking-wide transition-colors ${
        active ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-sage)] hover:text-[color:var(--color-ink)]"
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  );
}
