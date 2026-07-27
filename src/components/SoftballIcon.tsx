export function SoftballIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id="ball-body" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#faff9e" />
          <stop offset="45%" stopColor="#eaff00" />
          <stop offset="100%" stopColor="#8fa300" />
        </radialGradient>
        <linearGradient id="ball-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#ff00aa" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="21" fill="url(#ball-body)" />
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="none"
        stroke="url(#ball-rim)"
        strokeWidth="1.75"
        opacity="0.95"
      />

      <g stroke="#ff0066" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M12 8c5 5 7.5 10 7.5 16S17 35 12 40" />
        <path d="M36 8c-5 5-7.5 10-7.5 16S31 35 36 40" />
      </g>
      <g stroke="#ff0066" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
        <path d="M15.5 14.5h4M15 20h4.5M15 27h4.5M15.5 32.5h4" />
        <path d="M28.5 14.5h4M28.5 20h4.5M28.5 27h4.5M28.5 32.5h4" />
      </g>

      {/* Specular highlight */}
      <ellipse cx="17" cy="15" rx="5" ry="3.4" fill="#ffffff" opacity="0.32" />
    </svg>
  );
}
