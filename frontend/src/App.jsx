import { useState, useCallback, useEffect } from 'react';
import { createSession, cancelSession, analyzeCompany } from './lib/api';
import { useProgressPoller } from './hooks/useProgressPoller';

import StepIndicator from './components/StepIndicator';
import QuestionsPage from './pages/QuestionsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import RunningPage from './pages/RunningPage';
import CompanyPage from './pages/CompanyPage';
import ResultsPage from './pages/ResultsPage';

// ─────────────────────────────────────────────────────────────────────────────
// App Flow:
//
//   questions → keys → running → company → results
//                                   ↑          ↓
//                                   └──────────┘  (audit another company)
//
// The "running" step sends questions to the backend, which runs them
// through Claude → ChatGPT → Gemini sequentially and stores in MongoDB.
// Frontend polls backend every 1.5s for progress.
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ─── State ───────────────────────────────────────────────────────────
  const [step, setStep] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [error, setError] = useState(null);

  // Poll backend for progress (only active when step is 'running')
  const poller = useProgressPoller(
    step === 'running' ? sessionId : null
  );

  // Auto-transition: running → company when audit completes
  useEffect(() => {
    if (poller.isCompleted && step === 'running') {
      setStep('company');
    }
  }, [poller.isCompleted, step]);

  // ─── Step 1 → 2: Questions submitted ─────────────────────────────────
  const handleQuestionsNext = useCallback((qs) => {
    setQuestions(qs);
    setStep('keys');
  }, []);

  // ─── Step 2 → 3: API keys submitted, start audit on backend ─────────
  const handleKeysNext = useCallback(
    async (apiKeys) => {
      try {
        setError(null);
        setStep('running');

        // POST to backend — this creates a session and starts the audit
        const result = await createSession(questions, apiKeys);
        setSessionId(result.sessionId);
      } catch (err) {
        setError(err.message);
        setStep('keys'); // Go back so user can fix
      }
    },
    [questions]
  );

  // ─── Cancel running audit ────────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    if (sessionId) {
      try {
        await cancelSession(sessionId);
      } catch {
        // Ignore cancel errors
      }
    }
    setStep('questions');
    setSessionId(null);
  }, [sessionId]);

  // ─── Step 4 → 5: Analyze company against stored responses ───────────
  const handleAnalyze = useCallback(
    async (company) => {
      try {
        setAnalyzeLoading(true);
        setError(null);

        // POST to backend — scans MongoDB responses for citations
        const result = await analyzeCompany(sessionId, company);
        setAnalysisData(result);
        setStep('results');
      } catch (err) {
        setError(err.message);
      } finally {
        setAnalyzeLoading(false);
      }
    },
    [sessionId]
  );

  // ─── Results → Audit another company (reuse stored data) ────────────
  const handleAuditAnother = useCallback(() => {
    setAnalysisData(null);
    setError(null);
    setStep('company');
  }, []);

  // ─── Start a completely fresh audit ──────────────────────────────────
  const handleNewAudit = useCallback(() => {
    setStep('questions');
    setQuestions([]);
    setSessionId(null);
    setAnalysisData(null);
    setError(null);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background grid texture */}
      <div
        className="fixed inset-0 z-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Step indicator breadcrumb */}
        <StepIndicator currentStep={step} />

        {/* Error toast */}
        {error && (
          <div className="mb-6 p-4 bg-error/[0.08] border border-error/20 rounded-xl flex items-center justify-between">
            <span className="text-sm text-error">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-error/50 hover:text-error text-lg bg-transparent border-none cursor-pointer ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Page rendering based on current step */}

        {step === 'questions' && (
          <QuestionsPage onNext={handleQuestionsNext} />
        )}

        {step === 'keys' && (
          <ApiKeysPage
            questionCount={questions.length}
            onNext={handleKeysNext}
            onBack={() => setStep('questions')}
          />
        )}

        {step === 'running' && (
          <RunningPage
            sessionData={poller.data}
            overallPercent={poller.overallPercent}
            onCancel={handleCancel}
          />
        )}

        {step === 'company' && (
          <CompanyPage
            questionCount={questions.length}
            errorCount={poller.data?.errors?.length || 0}
            onAnalyze={handleAnalyze}
            isLoading={analyzeLoading}
          />
        )}

        {step === 'results' && analysisData && (
          <ResultsPage
            analysisData={analysisData}
            onAuditAnother={handleAuditAnother}
            onNewAudit={handleNewAudit}
          />
        )}
      </div>
    </div>
  );
}