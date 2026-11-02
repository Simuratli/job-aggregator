import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** App icon: a radar dish in the glossy XP icon style */
export const RadarIcon = (props: IconProps) => (
  <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden {...props}>
    <defs>
      <radialGradient id="radar-face" cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#d9f7d1" />
        <stop offset="0.55" stopColor="#3fae2a" />
        <stop offset="1" stopColor="#1d6e12" />
      </radialGradient>
    </defs>
    <circle cx="8" cy="8" r="7.2" fill="url(#radar-face)" stroke="#155a0c" strokeWidth=".8" />
    <circle cx="8" cy="8" r="4.4" fill="none" stroke="#e9ffe3" strokeOpacity=".7" strokeWidth=".8" />
    <path d="M8 8 13.6 4.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="10.6" cy="6.1" r="1.1" fill="#fff36b" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden {...props}>
    <circle cx="6.5" cy="6.5" r="4.6" fill="#d6ecff" stroke="#3168c6" strokeWidth="1.6" />
    <path d="M3.9 5.4a3 3 0 0 1 2.6-1.8" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    <path d="m10 10 4.2 4.2" stroke="#7a5a1d" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const GlobeIcon = (props: IconProps) => (
  <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden {...props}>
    <circle cx="8" cy="8" r="6.8" fill="#4e9be8" stroke="#1b4f9c" strokeWidth=".9" />
    <path d="M4 4.6c1.5.2 2.3 1.3 1.8 2.5-.4 1 .7 1.7 1.6 1.9.9.3.6 1.8-.3 2.4-.7.5-.6 1.6-.3 2.2M10 2.2c-.4 1 .2 2 1.2 2.1 1 .2 1.4 1.3 2.6 1.1M9.8 9.6c.9-.4 2 .1 2.2 1.1" fill="none" stroke="#56b536" strokeWidth="1.6" strokeLinecap="round" />
    <ellipse cx="6" cy="4.6" rx="2.6" ry="1.4" fill="#fff" fillOpacity=".35" />
  </svg>
);

export const ChevronIcon = ({ open, ...props }: IconProps & { open: boolean }) => (
  <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden {...props}>
    <path
      d={open ? "M2 6 5 3l3 3M2 9l3-3 3 3" : "M2 1l3 3 3-3M2 4l3 3 3-3"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);

export const MinimizeGlyph = () => (
  <svg width={9} height={9} viewBox="0 0 9 9" aria-hidden>
    <path d="M1 7.5h5" stroke="#fff" strokeWidth="2.2" />
  </svg>
);

export const MaximizeGlyph = () => (
  <svg width={9} height={9} viewBox="0 0 9 9" aria-hidden>
    <rect x="1" y="1" width="7" height="7" fill="none" stroke="#fff" strokeWidth="1.2" />
    <path d="M1 1.9h7" stroke="#fff" strokeWidth="1.8" />
  </svg>
);

export const CloseGlyph = () => (
  <svg width={9} height={9} viewBox="0 0 9 9" aria-hidden>
    <path d="m1 1 7 7M8 1 1 8" stroke="#fff" strokeWidth="1.8" />
  </svg>
);
