import { useState } from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { PLATFORMS } from '../lib/api';
import Header from '../components/Header';

const KEY_HINTS = {
  claude: {
    placeholder: 'sk-ant-api03-... (optional — leave empty to skip)',
    url: 'https://console.anthropic.com/settings/keys',
    required: false,
  },
  chatgpt: {
    placeholder: 'sk-proj-... (optional — leave empty to skip)',
    url: 'https://platform.openai.com/api-keys',
    required: false,
  },
  gemini: {
    placeholder: 'AIza... (free!)',
    url: 'https://aistudio.google.com/apikey',
    required: false,
  },
};

export default function ApiKeysPage({ questionCount, onNext, onBack }) {
  const [keys, setKeys] = useState({
    claude: '',
    chatgpt: '',
    gemini: '',
  });

  const [visible, setVisible] = useState({
    claude: false,
    chatgpt: false,
    gemini: false,
  });

  // At least one key must be filled
  const filledKeys = [keys.claude, keys.chatgpt, keys.gemini].filter(
    (k) => k.trim().length > 0
  );
  const hasAtLeastOne = filledKeys.length > 0;

  // Count active platforms for the summary
  const activePlatformCount = filledKeys.length;
  const totalCalls = questionCount * activePlatformCount;

  const updateKey = (platform, value) => {
    setKeys((prev) => ({ ...prev, [platform]: value }));
  };

  const toggleVisible = (platform) => {
    setVisible((prev) => ({ ...prev, [platform]: !prev[platform] }));
  };

  return (
    <div>
      <Header subtitle="Configure API Keys" />

      <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-2xl">
        Enter API keys for the platforms you want to test. You can enter{' '}
        <strong className="text-text">just one key</strong> (like Gemini which
        is free) or all three. Platforms without keys will be skipped.
      </p>

      {/* Audit plan summary */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-border mb-8">
        <span className="font-mono text-[10px] text-text-faint uppercase tracking-widest">
          Audit plan
        </span>
        <span className="font-mono text-sm font-semibold text-text">
          {questionCount} questions × {activePlatformCount} platform
          {activePlatformCount !== 1 ? 's' : ''} = {totalCalls} API calls
        </span>
      </div>

      {/* API key inputs */}
      <div className="space-y-5 max-w-xl">
        {PLATFORMS.map((p) => {
          const hint = KEY_HINTS[p.key];
          const hasKey = keys[p.key].trim().length > 0;
          return (
            <div key={p.key}>
              {/* Label row */}
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2">
                  <span style={{ color: p.color }} className="text-sm">
                    {p.icon}
                  </span>
                  <span className="text-sm font-semibold">
                    {p.label} API Key
                  </span>
                  {p.key === 'gemini' && (
                    <span className="font-mono text-[9px] text-success bg-success/10 px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  )}
                  {p.key !== 'gemini' && (
                    <span className="font-mono text-[9px] text-text-faint bg-white/[0.03] px-2 py-0.5 rounded-full">
                      OPTIONAL
                    </span>
                  )}
                </label>
                <a
                  href={hint.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-[10px] text-text-faint hover:text-text-muted transition-colors no-underline"
                >
                  Get key <ExternalLink size={10} />
                </a>
              </div>

              {/* Input */}
              <div className="relative">
                <input
                  type={visible[p.key] ? 'text' : 'password'}
                  value={keys[p.key]}
                  onChange={(e) => updateKey(p.key, e.target.value)}
                  placeholder={hint.placeholder}
                  className="w-full bg-white/[0.02] border rounded-lg px-4 py-3 pr-12 text-text font-mono text-[13px] transition-colors hover:border-border-hover"
                  style={{
                    borderColor: hasKey
                      ? `${p.color}35`
                      : 'rgba(255, 255, 255, 0.06)',
                  }}
                />
                <button
                  onClick={() => toggleVisible(p.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-text-faint hover:text-text-muted transition-colors p-1"
                  type="button"
                >
                  {visible[p.key] ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>

              {/* Status indicator */}
              {hasKey ? (
                <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: p.color }}
                  >
                    Key entered — will run
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1.5 ml-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-faint" />
                  <span className="font-mono text-[10px] text-text-faint">
                    No key — will skip
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-10">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg text-sm font-medium bg-white/[0.04] text-text-muted border border-border hover:border-border-hover transition-all cursor-pointer"
        >
          ← Back
        </button>

        <button
          onClick={() => onNext(keys)}
          disabled={!hasAtLeastOne}
          className="px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: hasAtLeastOne
              ? 'linear-gradient(135deg, #D97757, #10A37F)'
              : 'rgba(255, 255, 255, 0.04)',
            color: hasAtLeastOne ? '#fff' : 'rgba(255, 255, 255, 0.2)',
            boxShadow: hasAtLeastOne
              ? '0 4px 20px rgba(16, 163, 127, 0.2)'
              : 'none',
          }}
        >
          Start Audit ({activePlatformCount} platform
          {activePlatformCount !== 1 ? 's' : ''}) →
        </button>
      </div>
    </div>
  );
}