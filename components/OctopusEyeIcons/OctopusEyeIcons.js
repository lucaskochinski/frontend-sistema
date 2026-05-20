"use client";

/**
 * Ícones em currentColor: olho + três anéis tipo ventosas (identidade âmbar aplicada no CSS do botão).
 */
export function OctoEyeOpen({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} aria-hidden>
      <ellipse cx="12" cy="12" rx="10" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.92" />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" opacity="0.35" />
      <circle cx="5.5" cy="17.25" r="1" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.72" />
      <circle cx="18.5" cy="17.25" r="1" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.72" />
      <circle cx="12" cy="19.5" r="0.9" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.58" />
    </svg>
  );
}

export function OctoEyeShut({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} aria-hidden>
      <path
        d="M2.5 11.5c2.8-2.2 6.4-3.5 9.5-3.5 3.1 0 6.7 1.3 9.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M3 13.2c2.6 1.8 5.8 2.8 9 2.8s6.4-1 9-2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.82"
      />
      <circle cx="5.5" cy="17.25" r="1" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.72" />
      <circle cx="18.5" cy="17.25" r="1" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.72" />
      <circle cx="12" cy="19.5" r="0.9" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.58" />
    </svg>
  );
}
