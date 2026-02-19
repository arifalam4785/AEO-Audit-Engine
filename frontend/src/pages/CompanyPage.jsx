import { useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import Header from '../components/Header';

export default function CompanyPage({
  questionCount,
  errorCount,
  onAnalyze,
  isLoading,
}) {
  const [company, setCompany] = useState('');
  const successCount = questionCount * 3 - (errorCount || 0);

  const handleSubmit = () => {
    if (company.trim() && !isLoading) {
      onAnalyze(company.trim());
    }
  };

  return (
    <div>
      <Header subtitle="Enter Target Company" />

      {/* Success banner */}
      <div className="p-6 rounded-2xl bg-success/[0.05] border border-success/15 mb-10 text-center">
        <CheckCircle2 size={36} className="text-success mx-auto mb-3" />
        <div className="text-lg font-semibold text-success mb-1">
          Audit Complete!
        </div>
        <div className="text-sm text-text-muted">
          {successCount} responses stored in MongoDB
          <span className="text-text-faint"> · </span>
          {questionCount} questions × 3 platforms
        </div>
        {errorCount > 0 && (
          <div className="text-xs text-error/60 mt-1">
            ({errorCount} errors encountered)
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-2xl">
        Now enter the company name or website URL you want to audit. The
        backend will scan all {successCount} stored responses to find mentions
        and determine the ranking position of your target company across all
        three AI platforms.
      </p>

      {/* Search input */}
      <div className="relative max-w-lg">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. sirion.ai, Icertis, HubSpot..."
          autoFocus
          className="w-full bg-white/[0.02] border border-border rounded-xl pl-12 pr-5 py-4 text-text font-mono text-base transition-colors hover:border-border-hover"
        />
      </div>

      {/* Quick pick examples */}
      <div className="flex items-center gap-2 mt-3 ml-1">
        <span className="font-mono text-[10px] text-text-faint">Try:</span>
        {['sirion.ai', 'Icertis', 'DocuSign', 'Ironclad'].map((ex) => (
          <button
            key={ex}
            onClick={() => setCompany(ex)}
            className="font-mono text-[11px] text-text-faint hover:text-text-muted bg-white/[0.03] px-2.5 py-1 rounded-md border-none cursor-pointer transition-colors hover:bg-white/[0.06]"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Analyze button */}
      <button
        onClick={handleSubmit}
        disabled={!company.trim() || isLoading}
        className="mt-8 px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border-none cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
        style={{
          background:
            company.trim() && !isLoading
              ? 'linear-gradient(135deg, #4285F4, #3367D6)'
              : 'rgba(255, 255, 255, 0.04)',
          color:
            company.trim() && !isLoading
              ? '#fff'
              : 'rgba(255, 255, 255, 0.2)',
          boxShadow:
            company.trim() && !isLoading
              ? '0 4px 20px rgba(66, 133, 244, 0.25)'
              : 'none',
        }}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {isLoading ? 'Analyzing...' : 'Analyze Visibility →'}
      </button>
    </div>
  );
}