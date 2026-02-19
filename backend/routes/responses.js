import { Router } from 'express';
import Response from '../models/Response.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/responses/:sessionId
//
// Get ALL stored responses for a session (all 3 platforms).
// Returns an array of Response documents sorted by platform and question.
//
// Example: For 5 questions, returns 15 documents (5 × 3 platforms).
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:sessionId', async (req, res) => {
  try {
    const responses = await Response.find({
      sessionId: req.params.sessionId,
    }).sort({ platform: 1, questionIndex: 1 });

    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/responses/:sessionId/:platform
//
// Get responses for a SINGLE platform only.
// Useful if you want to inspect just Claude or just Gemini answers.
//
// Valid platforms: "claude", "chatgpt", "gemini"
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:sessionId/:platform', async (req, res) => {
  try {
    const { sessionId, platform } = req.params;

    const validPlatforms = ['claude', 'chatgpt', 'gemini'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        error: `Invalid platform "${platform}". Must be one of: ${validPlatforms.join(', ')}`,
      });
    }

    const responses = await Response.find({
      sessionId,
      platform,
    }).sort({ questionIndex: 1 });

    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;