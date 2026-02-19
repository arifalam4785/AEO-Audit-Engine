export default function Header({ subtitle }) {
  return (
    <div className="mb-12">
      {/* Brand identifier */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #D97757, #10A37F, #4285F4)',
          }}
        />
        <span className="font-mono text-[11px] text-text-faint uppercase tracking-[3px]">
          AI Visibility Audit Engine
        </span>
      </div>

      {/* Page title with gradient */}
      <h1
        className="font-display text-4xl md:text-5xl font-black leading-tight m-0"
        style={{
          background:
            'linear-gradient(135deg, #F0EDE6 0%, rgba(240, 237, 230, 0.55) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {subtitle}
      </h1>
    </div>
  );
}