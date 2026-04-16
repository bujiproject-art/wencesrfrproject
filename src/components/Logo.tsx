export default function Logo({
  className = 'h-8 w-8',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RFR Network logo"
      className={className}
    >
      <defs>
        <linearGradient id="rfr-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E4C856" />
          <stop offset="100%" stopColor="#8C7223" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="10" fill="#0A0A0A" stroke="url(#rfr-gold)" strokeWidth="1.5" />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="17"
        fontWeight="bold"
        fill="url(#rfr-gold)"
        letterSpacing="1"
      >
        RFR
      </text>
    </svg>
  );
}
