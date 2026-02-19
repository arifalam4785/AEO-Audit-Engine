const STEPS = [
  { key: 'questions', label: 'Questions' },
  { key: 'keys', label: 'API Keys' },
  { key: 'running', label: 'Running' },
  { key: 'company', label: 'Company' },
  { key: 'results', label: 'Results' },
];

export default function StepIndicator({ currentStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-1 mb-10 flex-wrap">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all duration-300"
            style={{
              background:
                i === currentIdx ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              color:
                i < currentIdx
                  ? 'rgba(16, 163, 127, 0.7)'
                  : i === currentIdx
                    ? 'rgba(240, 237, 230, 0.6)'
                    : 'rgba(240, 237, 230, 0.15)',
            }}
          >
            {i < currentIdx && (
              <span className="text-success">✓</span>
            )}
            {s.label}
          </div>

          {i < STEPS.length - 1 && (
            <span
              className="text-[8px] mx-0.5"
              style={{
                color:
                  i < currentIdx
                    ? 'rgba(16, 163, 127, 0.3)'
                    : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              ›
            </span>
          )}
        </div>
      ))}
    </div>
  );
}