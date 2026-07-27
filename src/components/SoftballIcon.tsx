export function SoftballIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="24" cy="24" r="21" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
      <path
        d="M12 8c5 5 7.5 10 7.5 16S17 35 12 40"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36 8c-5 5-7.5 10-7.5 16S31 35 36 40"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <g stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
        <path d="M15.5 14.5h4M15 20h4.5M15 27h4.5M15.5 32.5h4" />
        <path d="M28.5 14.5h4M28.5 20h4.5M28.5 27h4.5M28.5 32.5h4" />
      </g>
    </svg>
  );
}
