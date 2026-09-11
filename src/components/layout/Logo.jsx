export default function Logo({ size = 'default' }) {
  const iconSize = size === 'small' ? 28 : 36;
  const textSize = size === 'small' ? 'text-lg' : 'text-xl';

  return (
    <div className="flex items-center gap-2">
      <svg width={iconSize} height={iconSize} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="logoGradient" x1="0" y1="40" x2="40" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <rect x="4" y="24" width="6" height="12" rx="1.5" fill="url(#logoGradient)" />
        <rect x="13" y="16" width="6" height="20" rx="1.5" fill="url(#logoGradient)" />
        <rect x="22" y="8" width="6" height="28" rx="1.5" fill="url(#logoGradient)" />
        <path d="M22 10L32 4L36 10" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M14 20L32 4" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className={`font-display font-bold ${textSize} tracking-tight`}>
        <span className="text-ink">LEAD</span>
        <span className="brand-text">FLOW</span>
      </span>
    </div>
  );
}
