import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const footerLinks = [
  { href: "/", label: "Vision" },
  { href: "/technology", label: "Technology" },
  { href: "/upcoming", label: "Roadmap" },
  { href: "/try", label: "Try MVP" },
];

export function Footer() {
  return (
    <footer className="border-t border-[rgba(77,29,23,0.08)] bg-[rgba(255,247,241,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-3">
          <div className="flex items-center gap-3">
            <BrandMark className="h-12 w-12" />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-accent)]">
                Medusa
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-sage)]">
                Editorial beauty engine
              </p>
            </div>
          </div>
          <h2 className="font-serif text-3xl text-[color:var(--color-ink)] sm:text-4xl">
            A geometry-first beauty interface for personalized tutorials.
          </h2>
          <p className="max-w-lg text-sm leading-7 text-[color:var(--color-ink-soft)]">
            The current MVP already analyzes facial structure and generates live tutorials.
            The next release expands into custom prompt-led looks and product curation.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm text-[color:var(--color-ink-soft)]">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-300 hover:text-[color:var(--color-ink)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--color-sage)]">
            MVP shipping today. V2 in active build.
          </p>
        </div>
      </div>
    </footer>
  );
}
