import Link from "next/link";

const LINKS = [
  { href: "/how-it-works", label: "How the draft works" },
  { href: "/rules", label: "League rules" },
  { href: "/waiver", label: "Waiver" },
];

/**
 * Subtle shared nav. Present on every page but deliberately understated — the
 * check-in form is the point of the site, not the paperwork.
 */
export function SiteFooter({ showAdmin = false }: { showAdmin?: boolean }) {
  return (
    <footer className="mt-14 text-center">
      <nav
        aria-label="League information"
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-starlight-faint hover:text-neon-cyan text-[0.68rem] font-black tracking-[0.18em] uppercase transition-all duration-300 hover:drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* TEMPORARY FNL — first pitch 7:30 this week only (revert to "6:30 PM"; normal copy: "Teams are drawn Tuesdays · Play ball 6:30 PM") */}
      <p className="text-starlight-faint/70 mt-5 text-[0.62rem] font-bold tracking-[0.2em] uppercase">
        This week: Friday Night Lights · Play ball 7:30 PM
      </p>

      {showAdmin && (
        <Link
          href="/admin"
          className="text-neon-purple/70 hover:text-neon-cyan mt-3 inline-block text-[0.62rem] font-black tracking-[0.28em] uppercase transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]"
        >
          <span className="border-b border-current pb-0.5">Admin</span>
        </Link>
      )}
    </footer>
  );
}
