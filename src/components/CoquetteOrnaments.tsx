export function SatinBowIcon({ className = 'w-8 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M31 18C24 10 12 4 7 9C2 14 10 23 24 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(249, 207, 224, 0.45)"
      />
      <path
        d="M33 18C40 10 52 4 57 9C62 14 54 23 40 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(249, 207, 224, 0.45)"
      />
      <path
        d="M28 20L19 32L26 29L31 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 20L45 32L38 29L33 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse
        cx="32"
        cy="18.5"
        rx="4.2"
        ry="3.6"
        fill="#FDEEF4"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function RibbonDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 my-2" aria-hidden="true">
      <div className="h-px flex-1 bg-[#F1C6D6]" />
      <div className="flex items-center gap-2 text-[#D85A8A]">
        <SatinBowIcon className="w-7 h-4" />
        {label ? (
          <span className="font-editorial italic text-sm text-[#987382]">{label}</span>
        ) : null}
      </div>
      <div className="h-px flex-1 bg-[#F1C6D6]" />
    </div>
  );
}
