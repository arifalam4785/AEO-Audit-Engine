// ─────────────────────────────────────────────────────────────────────────────
// API Client — All calls go to Express backend via Vite proxy
// Frontend :5173 → proxy → Backend :5000
// ─────────────────────────────────────────────────────────────────────────────

const BASE = '/api';

async function request(path, options = {}) {
  let res;

  // Step 1: Try to connect to backend
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    throw new Error(
      `Cannot connect to backend server. Make sure it's running on http://localhost:5000. (${networkErr.message})`
    );
  }

  // Step 2: Read response as text first (safe — never crashes)
  const text = await res.text();

  // Step 3: Try to parse as JSON
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Backend returned invalid response (status ${res.status}): ${text.substring(0, 200)}`
    );
  }

  // Step 4: Check HTTP status
  if (!res.ok) {
    throw new Error(
      data.error || `Request failed with status ${res.status}`
    );
  }

  return data;
}

// ─── Session Endpoints ───────────────────────────────────────────────────────

/**
 * Create a new audit session and start running it on the backend.
 * Backend will run all 40 questions × 3 platforms in the background.
 *
 * @param {string[]} questions - Array of question strings
 * @param {{ claude: string, chatgpt: string, gemini: string }} apiKeys
 * @returns {{ sessionId: string, status: string, questionCount: number }}
 */
export async function createSession(questions, apiKeys) {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify({ questions, apiKeys }),
  });
}

/**
 * Poll session progress from MongoDB.
 * Call this every 1-2 seconds while the audit is running.
 *
 * @param {string} sessionId
 * @returns {{ sessionId, status, questionCount, progress, errors }}
 */
export async function getSessionProgress(sessionId) {
  return request(`/sessions/${sessionId}`);
}

/**
 * Cancel a running audit session.
 *
 * @param {string} sessionId
 */
export async function cancelSession(sessionId) {
  return request(`/sessions/${sessionId}/cancel`, {
    method: 'POST',
  });
}

// ─── Response Endpoints ──────────────────────────────────────────────────────

/**
 * Get all stored LLM responses for a session.
 *
 * @param {string} sessionId
 * @returns {Array} Array of response documents from MongoDB
 */
export async function getResponses(sessionId) {
  return request(`/responses/${sessionId}`);
}

// ─── Analysis Endpoints ──────────────────────────────────────────────────────

/**
 * Run citation analysis on stored responses for a target company.
 * Backend scans all responses in MongoDB and returns analysis.
 *
 * @param {string} sessionId
 * @param {string} company - Company name or URL
 * @returns {{ company, sessionId, summary, results, totalResponses }}
 */
export async function analyzeCompany(sessionId, company) {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({ sessionId, company }),
  });
}

// ─── Health Check ────────────────────────────────────────────────────────────

export async function checkHealth() {
  return request('/health');
}

// ─── Platform Constants (for UI rendering) ───────────────────────────────────

export const PLATFORMS = [
  {
    key: 'claude',
    label: 'Claude',
    color: '#D97757',
    bgColor: 'rgba(217, 119, 87, 0.1)',
    icon: '◈',
  },
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    color: '#10A37F',
    bgColor: 'rgba(16, 163, 127, 0.1)',
    icon: '◆',
  },
  {
    key: 'gemini',
    label: 'Gemini',
    color: '#4285F4',
    bgColor: 'rgba(66, 133, 244, 0.1)',
    icon: '◇',
  },
];