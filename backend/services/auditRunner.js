import { PLATFORMS } from './llmService.js';
import Session from '../models/Session.js';
import Response from '../models/Response.js';

// ─────────────────────────────────────────────────────────────────────────────
// Audit Runner
//
// Runs questions sequentially through each platform that has a valid API key.
// Platforms with empty keys are skipped automatically.
// ─────────────────────────────────────────────────────────────────────────────

const INTER_QUESTION_DELAY = 600;

export async function runAudit(sessionId, apiKeys) {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const questions = session.questions;

  // Filter to only platforms that have a valid API key
  const activePlatforms = PLATFORMS.filter(
    (p) => apiKeys[p.key] && apiKeys[p.key].trim().length > 0
  );

  if (activePlatforms.length === 0) {
    await Session.findByIdAndUpdate(sessionId, { status: 'error' });
    throw new Error('No valid API keys provided for any platform');
  }

  console.log(
    `\n📋 Running audit: ${questions.length} questions × ${activePlatforms.length} platform(s): ${activePlatforms.map((p) => p.label).join(', ')}`
  );

  // Mark skipped platforms as done immediately
  const skippedPlatforms = PLATFORMS.filter(
    (p) => !apiKeys[p.key] || apiKeys[p.key].trim().length === 0
  );
  for (const skipped of skippedPlatforms) {
    console.log(`  ⏭ Skipping ${skipped.label} (no API key)`);
    await Session.findByIdAndUpdate(sessionId, {
      [`progress.${skipped.key}`]: questions.length,
      $push: { 'progress.donePlatforms': skipped.key },
    });
  }

  try {
    for (const platform of activePlatforms) {
      console.log(`\n🔄 Starting ${platform.label}...`);

      await Session.findByIdAndUpdate(sessionId, {
        'progress.activePlatform': platform.key,
        [`progress.${platform.key}`]: 0,
      });

      for (let i = 0; i < questions.length; i++) {
        const currentSession = await Session.findById(sessionId);
        if (currentSession.status === 'cancelled') {
          console.log(`\n⛔ Session ${sessionId} was cancelled by user`);
          return;
        }

        const question = questions[i];
        let answer = '';
        let isError = false;
        let responseTime = 0;

        try {
          const apiKey = apiKeys[platform.key];
          const result = await platform.caller(question, apiKey);
          answer = result.answer;
          responseTime = result.responseTime;

          console.log(
            `  ✅ ${platform.label} Q${i + 1}/${questions.length} (${responseTime}ms)`
          );
        } catch (err) {
          answer = `[ERROR] ${err.message}`;
          isError = true;

          console.log(
            `  ❌ ${platform.label} Q${i + 1}/${questions.length}: ${err.message.substring(0, 100)}`
          );

          await Session.findByIdAndUpdate(sessionId, {
            $push: {
              auditErrors: {
                platform: platform.key,
                questionIndex: i,
                message: err.message.substring(0, 500),
              },
            },
          });
        }

        await Response.create({
          sessionId,
          platform: platform.key,
          questionIndex: i,
          question,
          answer,
          isError,
          responseTime,
        });

        await Session.findByIdAndUpdate(sessionId, {
          [`progress.${platform.key}`]: i + 1,
        });

        if (i < questions.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, INTER_QUESTION_DELAY)
          );
        }
      }

      await Session.findByIdAndUpdate(sessionId, {
        'progress.activePlatform': null,
        $push: { 'progress.donePlatforms': platform.key },
      });

      console.log(`  🏁 ${platform.label} complete`);
    }

    await Session.findByIdAndUpdate(sessionId, {
      status: 'completed',
      'progress.activePlatform': null,
    });

    const totalResponses = await Response.countDocuments({ sessionId });
    console.log(
      `\n🎉 Session ${sessionId} completed! ${totalResponses} responses stored in MongoDB.`
    );
  } catch (err) {
    await Session.findByIdAndUpdate(sessionId, {
      status: 'error',
      'progress.activePlatform': null,
    });
    console.error(`\n💥 Session ${sessionId} failed:`, err.message);
    throw err;
  }
}