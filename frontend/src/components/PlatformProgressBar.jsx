export default function PlatformProgressBar({
  platform,
  current,
  total,
  isActive,
  isDone,
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div
      className="rounded-xl px-5 py-4 transition-all duration-300"
      style={{
        background: isActive ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
        border: isActive
          ? `1px solid ${platform.color}25`
          : '1px solid transparent',
      }}
    >
      {/* Top row: platform name + status + count */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Platform icon */}
          <span style={{ color: platform.color }} className="text-sm">
            {platform.icon}
          </span>

          {/* Platform name */}
          <span className="text-sm font-semibold text-text">
            {platform.label}
          </span>

          {/* Running badge */}
          {isActive && (
            <span
              className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                color: platform.color,
                background: `${platform.color}12`,
              }}
            >
              <span className="inline-block animate-pulse mr-1">●</span>
              Running
            </span>
          )}

          {/* Complete badge */}
          {isDone && (
            <span className="font-mono text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-success/10 text-success">
              ✓ Complete
            </span>
          )}
        </div>

        {/* Counter */}
        <span className="font-mono text-xs text-text-muted">
          {current}/{total}
        </span>
      </div>

      {/* Progress bar track */}
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: platform.color,
            boxShadow: isActive ? `0 0 16px ${platform.color}40` : 'none',
          }}
        />
      </div>
    </div>
  );
}