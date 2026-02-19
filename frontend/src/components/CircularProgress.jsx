export default function CircularProgress({ percentage = 0, size = 160 }) {
  const strokeWidth = 7;
  const r = (size - strokeWidth * 2 - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="url(#auditProgressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />

        {/* Glow effect behind the progress arc */}
        {percentage > 0 && (
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="url(#auditProgressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              filter: 'blur(8px)',
              opacity: 0.3,
            }}
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient
            id="auditProgressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#D97757" />
            <stop offset="50%" stopColor="#10A37F" />
            <stop offset="100%" stopColor="#4285F4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold tracking-tight"
          style={{
            fontSize: size * 0.2,
            color: '#F0EDE6',
          }}
        >
          {Math.round(percentage)}%
        </span>
        <span
          className="font-mono uppercase tracking-widest"
          style={{
            fontSize: size * 0.055,
            color: 'rgba(240, 237, 230, 0.35)',
          }}
        >
          Complete
        </span>
      </div>
    </div>
  );
}