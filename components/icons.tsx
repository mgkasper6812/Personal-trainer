// Stroke icons (24px grid). Decorative unless a label is given.
type P = { size?: number; label?: string };
const svg = (path: React.ReactNode, { size = 24, label }: P, fill = false) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"}
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    {path}
  </svg>
);
export const IconHome = (p: P) => svg(<><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>, p);
export const IconTrain = (p: P) => svg(<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />, p);
export const IconPlus = (p: P) => svg(<path d="M12 5v14M5 12h14" />, p);
export const IconChart = (p: P) => svg(<><path d="M3 20h18" /><path d="m4 15 5-5 4 4 7-7" /></>, p);
export const IconUser = (p: P) => svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>, p);
export const IconCheck = (p: P) => svg(<path d="M20 6 9 17l-5-5" />, p);
export const IconChevron = (p: P) => svg(<path d="m9 18 6-6-6-6" />, p);
export const IconPlay = (p: P) => svg(<path d="M7 4v16l13-8z" />, p, true);
export const IconMoon = (p: P) => svg(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />, p);
export const IconWatch = (p: P) => svg(<><rect x="6" y="6" width="12" height="12" rx="3" /><path d="M9 6V3h6v3M9 18v3h6v-3M12 10v2l1.5 1.5" /></>, p);
export const IconUsers = (p: P) => svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.5 0 4 1.5 4.5 4" /></>, p);
export const IconSearch = (p: P) => svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, p);
export const IconClose = (p: P) => svg(<path d="M6 6l12 12M18 6 6 18" />, p);
export const IconTrophy = (p: P) => svg(<><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></>, p);
export const IconHeart = (p: P) => svg(<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />, p);
export const IconFork = (p: P) => svg(<><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" /><path d="M17 21V3c-2 1.5-3 4-3 7s1 3 3 3" /></>, p);
export const IconCart = (p: P) => svg(<><path d="M3 4h2l2.5 11h11L21 7H6.2" /><circle cx="9" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></>, p);
export const IconChat = (p: P) => svg(<path d="M4 5h16v11H9l-5 4z" />, p);
export const IconImage = (p: P) => svg(<><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>, p);
export const IconCamera = (p: P) => svg(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>, p);
export const IconScale = (p: P) => svg(<><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M9 9a4 4 0 0 1 6 0M12 9l1.5-2" /></>, p);
