import { useState } from 'react';
import {
  Download,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { PLATFORMS } from '../lib/api';
import Header from '../components/Header';

// ─── Summary Card ────────────────────────────────────────────────────────────

function SummaryCard({ platform, stats }) {
  return (
    <div
      className="p-5 rounded-2xl bg-white/[0.02] border transition-colors hover:border-opacity-30"
      style={{ borderColor: `${platform.color}18` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: platform.color }} className="text-sm">
          {platform.icon}
        </span>
        <span className="text-sm font-semibold">{platform.label}</span>
      </div>

      {/* Big number */}
      <div
        className="font-display text-4xl font-black mb-1"
        style={{ color: platform.color }}
      >
        {stats.citedCount}/{stats.totalQuestions}
      </div>

      {/* Stats line */}
      <div className="text-[11px] text-text-faint leading-relaxed">
        <span style={{ color: platform.color }}>
          {stats.citedPercent.toFixed(0)}%
        </span>{' '}
        visibility
        <span className="mx-1.5">·</span>
        avg rank{' '}
        <span style={{ color: platform.color }}>
          {stats.avgRank ? stats.avgRank.toFixed(1) : '—'}
        </span>
        <span className="mx-1.5">·</span>
        {stats.totalMentions} mentions
      </div>
    </div>
  );
}

// ─── Citation Badge ──────────────────────────────────────────────────────────

function CitationBadge({ analysis, color }) {
  if (!analysis.cited) {
    return <span className="text-text-faint text-lg">—</span>;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="inline-block px-3 py-1 rounded-md font-mono text-xs font-semibold"
        style={{ background: `${color}15`, color }}
      >
        {analysis.rank != null ? `#${analysis.rank}` : 'Cited'}
      </span>
      {analysis.mentions > 1 && (
        <span className="font-mono text-[9px] text-text-faint">
          {analysis.mentions}× mentioned
        </span>
      )}
    </div>
  );
}

// ─── Expandable Table Row ────────────────────────────────────────────────────

function ExpandableRow({ row, index }) {
  const [open, setOpen] = useState(false);

  return (
    <tr className="border-b border-border/50">
      {/* Question column */}
      <td className="p-4 align-top" style={{ maxWidth: 340 }}>
        <div className="flex items-start gap-2">
          {/* Expand toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="mt-0.5 p-0.5 bg-transparent border-none cursor-pointer text-text-faint hover:text-text-muted transition-colors shrink-0"
          >
            {open ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>

          <div>
            <span className="text-xs text-text-faint font-mono mr-1.5">
              Q{index + 1}
            </span>
            <span className="text-sm text-text-muted leading-relaxed">
              {row.question}
            </span>
          </div>
        </div>

        {/* Expanded: show full answers from all 3 platforms */}
        {open && (
          <div className="mt-4 ml-6 space-y-3">
            {PLATFORMS.map((p) => (
              <div key={p.key}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    style={{ color: p.color }}
                    className="text-[11px]"
                  >
                    {p.icon}
                  </span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: p.color }}
                  >
                    {p.label}
                  </span>
                </div>
                <div className="text-[11px] text-text-faint leading-relaxed max-h-36 overflow-y-auto p-3 bg-black/30 rounded-lg font-mono whitespace-pre-wrap">
                  {row.platforms[p.key].answer || '(No response)'}
                </div>
              </div>
            ))}
          </div>
        )}
      </td>

      {/* Citation columns for each platform */}
      {PLATFORMS.map((p) => (
        <td key={p.key} className="p-4 text-center align-top">
          <CitationBadge
            analysis={row.platforms[p.key].analysis}
            color={p.color}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Results Page ───────────────────────────────────────────────────────

export default function ResultsPage({
  analysisData,
  onAuditAnother,
  onNewAudit,
}) {
  const { company, summary, results } = analysisData;

  // ─── CSV Export ──────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      'Question',
      'Claude Cited',
      'Claude Rank',
      'Claude Mentions',
      'ChatGPT Cited',
      'ChatGPT Rank',
      'ChatGPT Mentions',
      'Gemini Cited',
      'Gemini Rank',
      'Gemini Mentions',
    ];

    const csvRows = [headers.join(',')];

    results.forEach((row) => {
      const line = [`"${row.question.replace(/"/g, '""')}"`];
      for (const pKey of ['claude', 'chatgpt', 'gemini']) {
        const a = row.platforms[pKey].analysis;
        line.push(
          a.cited ? 'Yes' : 'No',
          a.rank != null ? a.rank : '—',
          a.mentions
        );
      }
      csvRows.push(line.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visibility-audit-${company.replace(/[^a-z0-9]/gi, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── JSON Export ─────────────────────────────────────────────────────
  const exportJSON = () => {
    const report = {
      company,
      generatedAt: new Date().toISOString(),
      summary,
      details: results.map((r) => ({
        question: r.question,
        claude: {
          cited: r.platforms.claude.analysis.cited,
          rank: r.platforms.claude.analysis.rank,
          mentions: r.platforms.claude.analysis.mentions,
        },
        chatgpt: {
          cited: r.platforms.chatgpt.analysis.cited,
          rank: r.platforms.chatgpt.analysis.rank,
          mentions: r.platforms.chatgpt.analysis.mentions,
        },
        gemini: {
          cited: r.platforms.gemini.analysis.cited,
          rank: r.platforms.gemini.analysis.rank,
          mentions: r.platforms.gemini.analysis.mentions,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visibility-audit-${company.replace(/[^a-z0-9]/gi, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header subtitle="Audit Results" />

      {/* Target company badge */}
      <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] rounded-full border border-border mb-8">
        <Search size={14} className="text-text-faint" />
        <span className="font-mono text-[10px] text-text-faint uppercase tracking-[2px]">
          Target
        </span>
        <span className="text-base font-bold text-text">{company}</span>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {PLATFORMS.map((p) => (
          <SummaryCard key={p.key} platform={p} stats={summary[p.key]} />
        ))}
      </div>

      {/* Results table */}
      <div className="rounded-2xl border border-border overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="p-4 text-left font-mono text-[10px] text-text-faint uppercase tracking-[2px] border-b border-border min-w-[280px]">
                  Question
                </th>
                {PLATFORMS.map((p) => (
                  <th
                    key={p.key}
                    className="p-4 text-center font-mono text-[10px] uppercase tracking-wider border-b border-border min-w-[100px]"
                    style={{ color: p.color }}
                  >
                    {p.icon} {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <ExpandableRow key={i} row={row} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onAuditAnother}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-text-muted border border-border hover:border-border-hover transition-all cursor-pointer"
        >
          <Search size={14} />
          Audit Another Company
        </button>

        <button
          onClick={onNewAudit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-text-muted border border-border hover:border-border-hover transition-all cursor-pointer"
        >
          <RotateCcw size={14} />
          New Audit
        </button>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all"
          style={{
            background: 'linear-gradient(135deg, #4285F4, #3367D6)',
            color: '#fff',
          }}
        >
          <Download size={14} />
          Export CSV
        </button>

        <button
          onClick={exportJSON}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-text-muted border border-border hover:border-border-hover transition-all cursor-pointer"
        >
          <Download size={14} />
          Export JSON
        </button>
      </div>
    </div>
  );
}