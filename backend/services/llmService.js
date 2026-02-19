

// ─────────────────────────────────────────────────────────────────────────────
// LLM API Service
//
// DEMO MODE: When API key is "demo" or "test", uses free responses
// so you can test the full app flow without paying.
//
// PRODUCTION MODE: When real API keys are provided, calls actual APIs.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      console.log(`   ↻ Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ─── Demo Response Generator ─────────────────────────────────────────────────
// Generates realistic-looking responses with company mentions for testing

const DEMO_COMPANIES = [
  'Icertis', 'DocuSign', 'Ironclad', 'Agiloft', 'Sirion',
  'ContractPodAi', 'Juro', 'LinkSquares', 'Conga', 'SAP Ariba',
  'Coupa', 'Concord', 'PandaDoc', 'Precisely', 'Onit',
];

function generateDemoResponse(question, platformName) {
  // Simulate different response styles per platform
  const shuffled = [...DEMO_COMPANIES].sort(() => Math.random() - 0.5);
  const top5 = shuffled.slice(0, 5 + Math.floor(Math.random() * 3));

  const intro = {
    claude: `Based on current market analysis, here are the leading solutions relevant to your question: "${question.substring(0, 60)}..."`,
    chatgpt: `Great question! Here are some of the top platforms in this space:`,
    gemini: `Here's a comprehensive overview of the leading platforms:`,
  };

  let response = `${intro[platformName] || intro.claude}\n\n`;

  top5.forEach((company, i) => {
    const descriptions = [
      'Known for enterprise-grade features and AI-powered analytics.',
      'Offers comprehensive lifecycle management with strong integrations.',
      'Popular for its user-friendly interface and automation capabilities.',
      'Provides end-to-end contract management with compliance tracking.',
      'Features advanced AI for contract analysis and risk assessment.',
      'Trusted by Fortune 500 companies for complex contract workflows.',
      'Offers robust API integrations and customizable workflows.',
      'Known for rapid implementation and excellent customer support.',
    ];
    const desc = descriptions[i % descriptions.length];
    response += `${i + 1}. **${company}** — ${desc}\n`;
  });

  response += `\nEach of these platforms offers unique strengths. The best choice depends on your specific requirements, budget, and integration needs.`;

  return response;
}

async function callDemo(question, apiKey, platformName) {
  const start = Date.now();

  // Simulate realistic API latency (800ms - 2500ms)
  const delay = 800 + Math.random() * 1700;
  await new Promise((r) => setTimeout(r, delay));

  const answer = generateDemoResponse(question, platformName);
  const responseTime = Date.now() - start;

  return { answer, responseTime };
}

function isDemoKey(apiKey) {
  if (!apiKey) return false;
  const lower = apiKey.trim().toLowerCase();
  return lower === 'demo' || lower === 'test' || lower === 'free';
}

// ─── Claude (Anthropic) ──────────────────────────────────────────────────────

export async function callClaude(question, apiKey) {
  if (isDemoKey(apiKey)) {
    console.log('     🎭 Demo mode');
    return callDemo(question, apiKey, 'claude');
  }

  return withRetry(async () => {
    const start = Date.now();

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude ${res.status}: ${errText.substring(0, 300)}`);
    }

    const data = await res.json();
    const answer = data.content.map((block) => block.text || '').join('\n');
    const responseTime = Date.now() - start;

    return { answer, responseTime };
  });
}

// ─── ChatGPT (OpenAI) ────────────────────────────────────────────────────────

export async function callChatGPT(question, apiKey) {
  if (isDemoKey(apiKey)) {
    console.log('     🎭 Demo mode');
    return callDemo(question, apiKey, 'chatgpt');
  }

  return withRetry(async () => {
    const start = Date.now();

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }],
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ChatGPT ${res.status}: ${errText.substring(0, 300)}`);
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || '';
    const responseTime = Date.now() - start;

    return { answer, responseTime };
  });
}

// ─── Gemini (Google) ─────────────────────────────────────────────────────────

export async function callGemini(question, apiKey) {
  if (isDemoKey(apiKey)) {
    console.log('     🎭 Demo mode');
    return callDemo(question, apiKey, 'gemini');
  }

  return withRetry(async () => {
    const start = Date.now();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini ${res.status}: ${errText.substring(0, 300)}`);
    }

    const data = await res.json();
    const answer =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') ||
      '';
    const responseTime = Date.now() - start;

    return { answer, responseTime };
  });
}

// ─── Platform Registry ───────────────────────────────────────────────────────

export const PLATFORMS = [
  { key: 'claude', label: 'Claude', caller: callClaude },
  { key: 'chatgpt', label: 'ChatGPT', caller: callChatGPT },
  { key: 'gemini', label: 'Gemini', caller: callGemini },
];