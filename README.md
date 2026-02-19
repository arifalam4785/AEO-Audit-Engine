# ◈ AEO Audit Engine

Audit your brand's visibility across Claude, ChatGPT, and Gemini. Send questions, analyze citations, track rankings. Built for Answer Engine Optimization (AEO).

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## The Problem

Millions of people now skip Google and ask AI assistants directly:

> *"What's the best CRM software?"*
> *"Which procurement platform should I use?"*

If your brand isn't in those AI answers, you're invisible to a growing audience. Traditional SEO tools can't track this. AEO Audit Engine can.

## What It Does

Send up to **40 real questions** to **Claude, ChatGPT, and Gemini** simultaneously. The engine captures every response, stores them in MongoDB, then scans each answer to find:

- ✅ **Is your company cited?**
- 📊 **At what rank?** (#1, #2, #3...)
- 🔢 **How many times mentioned?**
- 📈 **Visibility % per platform**

Audit multiple companies against the same stored responses — no need to re-run API calls.

---

## Screenshots

### Real-time Progress Tracking
```
◈ Claude    ● RUNNING    ████████████░░░░  12/20
◆ ChatGPT   ✓ COMPLETE   ████████████████  20/20
◇ Gemini    ○ WAITING    ░░░░░░░░░░░░░░░░   0/20
```

### Results Dashboard
```
┌──────────────┬──────────────┬──────────────┐
│  ◈ Claude    │  ◆ ChatGPT   │  ◇ Gemini    │
│    12/20     │     8/20     │    15/20     │
│  60% cited   │   40% cited  │  75% cited   │
│  avg rank #2 │  avg rank #4 │  avg rank #1 │
└──────────────┴──────────────┴──────────────┘
```

---

## Quick Start

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **MongoDB** — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://cloud.mongodb.com) (free tier)

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/aeo-audit-engine.git
cd aeo-audit-engine
```

### 2. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure

Edit `backend/.env` with your API keys:

```env
MONGODB_URI=mongodb://localhost:27017/ai-audit-engine
PORT=5000

# Get from: https://console.anthropic.com/settings/keys
CLAUDE_API_KEY=sk-ant-api03-xxxxx

# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxx

# Get from: https://aistudio.google.com/apikey (FREE)
GEMINI_API_KEY=AIzaxxxxx
```

> **💡 Demo Mode:** Don't have API keys yet? Type `demo` as the key for any platform to test with simulated responses.

### 4. Run

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# ✅ MongoDB connected
# 🔥 Server on http://localhost:5000
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

### 5. Open

Navigate to **http://localhost:5173** and start auditing!

---

## How It Works

### 5-Step Flow

```
┌─────────────┐     ┌──────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ 1. Paste     │ ──→ │ 2. Enter  │ ──→ │ 3. Watch │ ──→ │ 4. Enter│ ──→ │ 5. View │
│  Questions   │     │ API Keys  │     │ Progress │     │ Company │     │ Results │
└─────────────┘     └──────────┘     └─────────┘     └─────────┘     └─────────┘
```

### Execution Order

Questions are sent **sequentially** to avoid rate limits:

```
Q1 → Claude → MongoDB     Q2 → Claude → MongoDB     ... Q40 → Claude → MongoDB
Q1 → ChatGPT → MongoDB    Q2 → ChatGPT → MongoDB    ... Q40 → ChatGPT → MongoDB
Q1 → Gemini → MongoDB     Q2 → Gemini → MongoDB     ... Q40 → Gemini → MongoDB
```

### Citation Analysis

The analyzer checks each response for:

1. **Company name variants** — `sirion.ai` also checks `sirion`
2. **Numbered rank** — extracts position from lists (`1.`, `#1`, `1)`)
3. **Mention count** — total occurrences across the response
4. **First position** — which paragraph/section mentions the company first

---

## Project Structure

```
aeo-audit-engine/
│
├── backend/                          Express + MongoDB
│   ├── server.js                     Entry point
│   ├── .env                          API keys + MongoDB URI
│   ├── config/
│   │   └── db.js                     MongoDB connection
│   ├── models/
│   │   ├── Session.js                Audit session (progress, status)
│   │   └── Response.js               LLM answers (120 per audit)
│   ├── services/
│   │   ├── llmService.js             Claude / ChatGPT / Gemini callers
│   │   ├── auditRunner.js            Sequential orchestration engine
│   │   └── analyzerService.js        Citation detection + ranking
│   └── routes/
│       ├── sessions.js               Create, poll, cancel
│       ├── responses.js              Get stored answers
│       └── analyze.js                Company visibility analysis
│
├── frontend/                         React + Vite + Tailwind
│   ├── vite.config.js                Proxy /api → backend:5000
│   ├── src/
│   │   ├── App.jsx                   State machine (5 steps)
│   │   ├── lib/api.js                API client → Express
│   │   ├── hooks/
│   │   │   └── useProgressPoller.js  Polls backend every 1.5s
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── StepIndicator.jsx
│   │   │   ├── CircularProgress.jsx
│   │   │   └── PlatformProgressBar.jsx
│   │   └── pages/
│   │       ├── QuestionsPage.jsx     Step 1: Paste questions
│   │       ├── ApiKeysPage.jsx       Step 2: Enter API keys
│   │       ├── RunningPage.jsx       Step 3: Live progress
│   │       ├── CompanyPage.jsx       Step 4: Enter company
│   │       └── ResultsPage.jsx       Step 5: Results + export
│   └── index.html
│
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/sessions` | Create session + start audit |
| `GET` | `/api/sessions/:id` | Poll progress |
| `POST` | `/api/sessions/:id/cancel` | Cancel running audit |
| `GET` | `/api/responses/:sessionId` | Get all stored answers |
| `GET` | `/api/responses/:sessionId/:platform` | Get answers for one platform |
| `POST` | `/api/analyze` | Analyze responses for company citations |
| `GET` | `/api/health` | Health check |

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-platform audit** | Claude, ChatGPT, and Gemini in one run |
| **Real-time progress** | Circular + per-platform progress bars, polls every 1.5s |
| **MongoDB storage** | All responses persisted for re-analysis |
| **Smart citation detection** | Name variants, numbered rank extraction, mention counting |
| **Multi-company analysis** | Audit different companies without re-running API calls |
| **Demo mode** | Type `demo` as API key to test without spending money |
| **Optional platforms** | Skip any platform by leaving the key empty |
| **Error resilience** | Retry logic, graceful error handling, continues on failures |
| **Export** | CSV and JSON reports for client deliverables |
| **Expandable responses** | Click any row to see full LLM answers |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, Lucide Icons |
| Backend | Express.js 4, Mongoose 8 |
| Database | MongoDB |
| APIs | Anthropic Claude, OpenAI ChatGPT, Google Gemini |
| Fonts | DM Sans, JetBrains Mono, Fraunces |

---

## API Cost Estimate (40 questions)

| Platform | Model | Approx. Cost |
|----------|-------|-------------|
| Claude | claude-sonnet-4 | ~$0.30 |
| ChatGPT | gpt-4o-mini | ~$0.05 |
| Gemini | gemini-2.0-flash | **Free** |
| **Total** | | **~$0.37** |

> **Tip:** Use Gemini only (free) for initial testing, then add Claude and ChatGPT for production audits.

---

## MongoDB Collections

**sessions** — Audit run metadata
```json
{
  "questions": ["What are the top CLM platforms?", ...],
  "questionCount": 40,
  "status": "completed",
  "progress": { "claude": 40, "chatgpt": 40, "gemini": 40 }
}
```

**responses** — Individual LLM answers
```json
{
  "sessionId": "ObjectId(...)",
  "platform": "claude",
  "questionIndex": 0,
  "question": "What are the top CLM platforms?",
  "answer": "Here are the leading CLM platforms: 1. Icertis...",
  "responseTime": 2340
}
```

---

## Use Cases

- **Marketing agencies** — Generate AEO reports for clients showing their AI visibility vs competitors
- **Brand managers** — Track whether AI platforms recommend your brand
- **Sales teams** — Know if AI suggests your product when prospects ask
- **SEO professionals** — Expand into Answer Engine Optimization with data-driven insights
- **Competitive intelligence** — See which competitors AI platforms prefer

---

## Roadmap

- [ ] Scheduled audits (daily/weekly tracking)
- [ ] Historical visibility trends with charts
- [ ] PDF report generation
- [ ] More LLM platforms (Perplexity, Copilot)
- [ ] Bulk company comparison in one view
- [ ] Webhook notifications on visibility changes

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ◈ for the AEO era
</p>
