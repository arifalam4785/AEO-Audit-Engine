import { Router } from 'express';
import Response from '../models/Response.js';
import {
  analyzeFullAudit,
  generateSummary,
} from '../services/analyzerService.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/analyze
//
// The main analysis endpoint. Takes a sessionId and company name/URL,
// fetches all stored responses from MongoDB, then scans every response
// to check if the company is mentioned and at what rank.
//
// This is called AFTER the audit is complete. You can call it multiple
// times with different company names to audit different companies
// against the same stored data (no need to re-run the LLM queries).
//
// Request body:
//   { sessionId: string, company: string }
//
// Response:
//   {
//     company: "sirion.ai",
//     sessionId: "...",
//     summary: {
//       claude:  { totalQuestions, citedCount, citedPercent, avgRank, totalMentions },
//       chatgpt: { ... },
//       gemini:  { ... }
//     },
//     results: [
//       {
//         questionIndex: 0,
//         question: "What are the top CLM platforms?",
//         platforms: {
//           claude:  { answer: "...", analysis: { cited, rank, mentions, position } },
//           chatgpt: { answer: "...", analysis: { ... } },
//           gemini:  { answer: "...", analysis: { ... } }
//         }
//       },
//       ...
//     ],
//     totalResponses: 120
//   }
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { sessionId, company } = req.body;

    // ─── Validation ────────────────────────────────────────────────────
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (!company || company.trim().length === 0) {
      return res.status(400).json({ error: 'company name is required' });
    }

    // ─── Fetch all responses from MongoDB ──────────────────────────────
    const responses = await Response.find({ sessionId }).sort({
      platform: 1,
      questionIndex: 1,
    });

    if (responses.length === 0) {
      return res.status(404).json({
        error: 'No responses found for this session. The audit may still be running.',
      });
    }

    console.log(
      `\n🔍 Analyzing "${company}" across ${responses.length} responses...`
    );

    // ─── Run citation analysis ─────────────────────────────────────────
    const analyzed = analyzeFullAudit(responses, company.trim());
    const summary = generateSummary(analyzed);

    // Log summary
    const platforms = ['claude', 'chatgpt', 'gemini'];
    for (const p of platforms) {
      const s = summary[p];
      console.log(
        `   ${p}: ${s.citedCount}/${s.totalQuestions} cited (${s.citedPercent.toFixed(0)}%) avg rank: ${s.avgRank ? s.avgRank.toFixed(1) : '—'}`
      );
    }

    // ─── Return results ────────────────────────────────────────────────
    res.json({
      company: company.trim(),
      sessionId,
      summary,
      results: analyzed,
      totalResponses: responses.length,
    });
  } catch (err) {
    console.error('POST /api/analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;