import { PLATFORMS } from '../lib/api';
import Header from '../components/Header';
import CircularProgress from '../components/CircularProgress';
import PlatformProgressBar from '../components/PlatformProgressBar';
import { AlertCircle } from 'lucide-react';

export default function RunningPage({
  sessionData,
  overallPercent,
  onCancel,
}) {
  // Loading state before first poll returns
  if (!sessionData) {
    return (
      <div>
        <Header subtitle="Starting Audit..." />
        <div className="flex items-center gap-3 mt-8">
          <div className="w-5 h-5 border-2 border-claude border-t-transparent rounded-full animate-spin" />
          <span className="text-text-muted text-sm">
            Connecting to server...
          </span>
        </div>
      </div>
    );
  }

  const { progress, questionCount, errors } = sessionData;
  const completed =
    progress.claude + progress.chatgpt + progress.gemini;
  const total = questionCount * 3;

  // Estimate remaining time (rough: ~3 seconds per question)
  const remaining = total - completed;
  const estMinutes = Math.ceil((remaining * 3) / 60);

  return (
    <div>
      <Header subtitle="Audit in Progress" />

      {/* Main progress area */}
      <div className="flex flex-col md:flex-row items-start gap-10 mb-8">
        {/* Left: Circular overall progress */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <CircularProgress percentage={overallPercent} />
          <div className="text-center">
            <span className="font-mono text-[10px] text-text-faint uppercase tracking-[3px] block">
              Overall
            </span>
            <span className="font-mono text-xs text-text-muted">
              {completed} / {total}
            </span>
          </div>
        </div>

        {/* Right: Per-platform progress bars */}
        <div className="flex-1 w-full space-y-2">
          {PLATFORMS.map((p) => (
            <PlatformProgressBar
              key={p.key}
              platform={p}
              current={progress[p.key] || 0}
              total={questionCount}
              isActive={progress.activePlatform === p.key}
              isDone={
                progress.donePlatforms
                  ? progress.donePlatforms.includes(p.key)
                  : false
              }
            />
          ))}
        </div>
      </div>

      {/* Estimated time remaining */}
      {progress.activePlatform && remaining > 0 && (
        <div className="font-mono text-[11px] text-text-faint mb-6">
          ⏱ Estimated remaining: ~{estMinutes} min ({remaining} calls left)
        </div>
      )}

      {/* Errors section */}
      {errors && errors.length > 0 && (
        <div className="p-4 bg-error/[0.06] rounded-xl border border-error/20 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-error" />
            <span className="font-mono text-[10px] text-error uppercase tracking-[2px]">
              Errors ({errors.length})
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {errors.map((err, i) => (
              <div
                key={i}
                className="font-mono text-[11px] text-error/60 leading-relaxed"
              >
                <span className="text-error/40">
                  [{err.platform}:Q{err.questionIndex + 1}]
                </span>{' '}
                {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="px-6 py-2.5 rounded-lg text-sm font-medium bg-error/[0.08] text-error border border-error/20 hover:bg-error/[0.12] transition-all cursor-pointer"
      >
        Cancel Audit
      </button>
    </div>
  );
}