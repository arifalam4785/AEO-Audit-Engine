import { useState } from 'react';
import Header from '../components/Header';

const MAX_QUESTIONS = 40;

const SAMPLE_QUESTIONS = `What are the top contract lifecycle management platforms?
Which CLM tools are best for enterprise use?
What are the leading AI-powered contract management solutions?
Compare the best contract automation software in 2025
Which companies lead in contract analytics?`;

export default function QuestionsPage({ onNext }) {
  const [text, setText] = useState('');

  // Parse text into array of non-empty questions
  const questions = text
    .split('\n')
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  const count = questions.length;
  const isValid = count > 0 && count <= MAX_QUESTIONS;

  const handleContinue = () => {
    if (isValid) {
      onNext(questions);
    }
  };

  return (
    <div>
      <Header subtitle="Paste Your Questions" />

      <p className="text-sm text-text-muted leading-relaxed mb-5 max-w-2xl">
        Enter up to {MAX_QUESTIONS} questions below, one per line. Each question
        will be sent sequentially to Claude, ChatGPT, and Gemini. All responses
        get stored in MongoDB for analysis.
      </p>

      {/* Main textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE_QUESTIONS}
          rows={16}
          className="w-full bg-white/[0.02] border border-border rounded-2xl p-6 text-text font-mono text-[13px] leading-[2] resize-y transition-colors hover:border-border-hover"
        />

        {/* Live line count */}
        {count > 0 && (
          <div className="absolute top-6 right-6 font-mono text-[10px] text-text-faint">
            {count} line{count !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Footer: count + actions */}
      <div className="flex items-center justify-between mt-5">
        <div className="flex items-center gap-4">
          {/* Question counter */}
          <span
            className="font-mono text-xs"
            style={{
              color:
                count > MAX_QUESTIONS
                  ? '#E55959'
                  : 'rgba(240, 237, 230, 0.4)',
            }}
          >
            {count} / {MAX_QUESTIONS} questions
            {count > MAX_QUESTIONS && ' — too many!'}
          </span>

          {/* Load samples button */}
          {count === 0 && (
            <button
              onClick={() => setText(SAMPLE_QUESTIONS)}
              className="font-mono text-[11px] text-text-faint hover:text-text-muted transition-colors cursor-pointer bg-transparent border-none underline underline-offset-2"
            >
              Load sample questions
            </button>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: isValid
              ? 'linear-gradient(135deg, #D97757, #C56A4A)'
              : 'rgba(255, 255, 255, 0.04)',
            color: isValid ? '#fff' : 'rgba(255, 255, 255, 0.2)',
            boxShadow: isValid
              ? '0 4px 20px rgba(217, 119, 87, 0.25)'
              : 'none',
          }}
        >
          Continue to API Keys →
        </button>
      </div>
    </div>
  );
}