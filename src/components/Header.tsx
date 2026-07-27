import { SoftballIcon } from "@/components/SoftballIcon";

export function Header({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <SoftballIcon className="h-14 w-14 drop-shadow-sm sm:h-16 sm:w-16" />
      <div>
        <h1 className="text-field-900 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Stuart Softball League{" "}
          <span className="text-field-600">&rsquo;26</span>
        </h1>
        <p className="text-field-700/80 mt-1.5 text-sm font-medium sm:text-base">
          {subtitle ?? "Adult coed · Tuesday nights"}
        </p>
      </div>
    </header>
  );
}
