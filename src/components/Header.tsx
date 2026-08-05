import { SoftballIcon } from "@/components/SoftballIcon";

/**
 * Site header. With no `subtitle` it renders the league's headline detail —
 * coed, Tuesdays, and first pitch at 6:30 — with the time given real emphasis,
 * since that is the thing people actually need to know. Inner pages pass their
 * own plain-text subtitle instead.
 */
export function Header({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <div className="relative">
        {/* Halo behind the ball */}
        <div
          className="absolute inset-0 -z-10 scale-[1.9] rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(240,255,0,0.42) 0%, rgba(255,0,170,0.22) 45%, transparent 70%)",
            animation: "nebula-breathe 7s ease-in-out infinite",
          }}
        />
        <SoftballIcon
          priority
          className="animate-float-slow h-16 w-16 drop-shadow-[0_0_18px_rgba(240,255,0,0.55)] sm:h-20 sm:w-20"
        />
      </div>

      <div>
        <h1 className="text-glow-title text-[2.15rem] leading-[1.05] font-black tracking-tight text-balance uppercase sm:text-5xl">
          Stuart Softball League{" "}
          <span className="whitespace-nowrap">&rsquo;26</span>
        </h1>

        {subtitle ? (
          <p className="text-neon-cyan/85 mt-3 text-xs font-bold tracking-[0.28em] uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] sm:text-sm">
            {subtitle}
          </p>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-2.5">
            {/* TEMPORARY FNL — normally "Adult coed · Sandlot Tuesdays" */}
            <p className="text-neon-cyan/85 text-[0.68rem] font-bold tracking-[0.28em] uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] sm:text-xs">
              Adult coed &middot; Friday Night Lights
            </p>

            <p className="flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-1">
              <span className="text-starlight-faint text-[0.62rem] font-black tracking-[0.26em] uppercase">
                First pitch
              </span>
              <span
                className="text-neon-yellow text-2xl font-black tracking-tight tabular-nums sm:text-3xl"
                style={{
                  textShadow:
                    "0 0 14px rgba(240,255,0,0.75), 0 0 38px rgba(240,255,0,0.4)",
                }}
              >
                6:30 PM
              </span>
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
