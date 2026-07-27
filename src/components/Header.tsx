import { SoftballIcon } from "@/components/SoftballIcon";

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
        <SoftballIcon className="animate-float-slow h-16 w-16 drop-shadow-[0_0_18px_rgba(240,255,0,0.55)] sm:h-20 sm:w-20" />
      </div>

      <div>
        <h1 className="text-glow-title text-[2.15rem] leading-[1.05] font-black tracking-tight text-balance uppercase sm:text-5xl">
          Stuart Softball League{" "}
          <span className="whitespace-nowrap">&rsquo;26</span>
        </h1>

        <p className="text-neon-cyan/85 mt-3 text-xs font-bold tracking-[0.28em] uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.5)] sm:text-sm">
          {subtitle ?? "Adult coed · Tuesday nights"}
        </p>
      </div>
    </header>
  );
}
