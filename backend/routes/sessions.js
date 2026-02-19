import { Router } from 'express';
import Session from '../models/Session.js';
import { runAudit } from '../services/auditRunner.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions
// Now accepts partial API keys — at least 1 platform key is required.
// Platforms with empty keys will be skipped.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { questions, apiKeys } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ error: 'questions array is required and cannot be empty' });
    }

    if (questions.length > 40) {
      return res
        .status(400)
        .json({ error: 'Maximum 40 questions allowed' });
    }

    if (!apiKeys) {
      return res
        .status(400)
        .json({ error: 'apiKeys object is required' });
    }

    // At least one key must be provided
    const hasAtLeastOneKey =
      (apiKeys.claude && apiKeys.claude.trim()) ||
      (apiKeys.chatgpt && apiKeys.chatgpt.trim()) ||
      (apiKeys.gemini && apiKeys.gemini.trim());

    if (!hasAtLeastOneKey) {
      return res
        .status(400)
        .json({ error: 'At least one API key is required' });
    }

    // Log which platforms will run
    const activePlatforms = [];
    if (apiKeys.claude && apiKeys.claude.trim()) activePlatforms.push('Claude');
    if (apiKeys.chatgpt && apiKeys.chatgpt.trim()) activePlatforms.push('ChatGPT');
    if (apiKeys.gemini && apiKeys.gemini.trim()) activePlatforms.push('Gemini');

    const session = await Session.create({
      questions: questions.map((q) => q.trim()).filter((q) => q.length > 0),
      questionCount: questions.length,
      status: 'running',
    });

    console.log(
      `\n🚀 New audit session: ${session._id} (${questions.length} questions)`
    );
    console.log(`   Platforms: ${activePlatforms.join(', ')}`);

    runAudit(session._id, apiKeys).catch((err) => {
      console.error(`Session ${session._id} runner failed:`, err.message);
    });

    res.status(201).json({
      sessionId: session._id,
      status: 'running',
      questionCount: questions.length,
      platforms: activePlatforms,
    });
  } catch (err) {
    console.error('POST /api/sessions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/sessions/:id — Poll progress ──────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session._id,
      status: session.status,
      questionCount: session.questionCount,
      progress: {
        claude: session.progress.claude,
        chatgpt: session.progress.chatgpt,
        gemini: session.progress.gemini,
        activePlatform: session.progress.activePlatform,
        donePlatforms: session.progress.donePlatforms,
      },
      errors: session.auditErrors,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/sessions/:id/cancel ──────────────────────────────────────────

router.post('/:id/cancel', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', 'progress.activePlatform': null },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`⛔ Session ${session._id} cancelled by user`);

    res.json({
      sessionId: session._id,
      status: 'cancelled',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;