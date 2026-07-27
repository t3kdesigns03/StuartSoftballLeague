import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SoftballIcon } from "@/components/SoftballIcon";

/**
 * Shared shell for the informational pages (/how-it-works, /rules, /waiver) so
 * they inherit the cosmic theme without each rebuilding the chrome.
 */
export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="text-starlight-faint hover:text-neon-cyan inline-flex items-center gap-2 text-[0.68rem] font-black tracking-[0.2em] uppercase transition-colors duration-300"
      >
        <span aria-hidden="true">←</span> Back to check-in
      </Link>

      <header className="mt-8 flex flex-col items-center gap-4 text-center">
        <SoftballIcon className="animate-float-slow h-12 w-12 drop-shadow-[0_0_16px_rgba(240,255,0,0.5)]" />
        <div>
          <p className="text-neon-cyan/85 text-[0.68rem] font-black tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            {eyebrow}
          </p>
          <h1 className="text-glow-title mt-2 text-3xl font-black tracking-tight text-balance uppercase sm:text-4xl">
            {title}
          </h1>
          {intro && (
            <p className="text-starlight-dim mx-auto mt-3 max-w-xl text-sm leading-relaxed">
              {intro}
            </p>
          )}
        </div>
      </header>

      <div className="mt-10 space-y-5">{children}</div>

      <SiteFooter />
    </main>
  );
}

/** A frosted panel section used throughout the content pages. */
export function ContentSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-blob p-5 sm:p-7">
      {title && (
        <h2 className="text-starlight mb-4 text-lg font-extrabold tracking-wide uppercase sm:text-xl">
          {title}
        </h2>
      )}
      <div className="text-starlight-dim space-y-3 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}
