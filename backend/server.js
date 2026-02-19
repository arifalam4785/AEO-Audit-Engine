import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import sessionRoutes from './routes/sessions.js';
import responseRoutes from './routes/responses.js';
import analyzeRoutes from './routes/analyze.js';

// ─────────────────────────────────────────────────────────────────────────────
// AI Visibility Audit Engine — Backend Server
//
// Express.js server that:
// 1. Accepts audit sessions from the frontend
// 2. Calls Claude, ChatGPT, Gemini APIs sequentially
// 3. Stores all responses in MongoDB
// 4. Runs citation analysis against stored data
//
// API Endpoints:
//   POST   /api/sessions          → Create session + start audit
//   GET    /api/sessions/:id      → Poll progress
//   POST   /api/sessions/:id/cancel → Cancel running audit
//   GET    /api/responses/:sid    → Get stored answers
//   POST   /api/analyze           → Analyze for company citations
//   GET    /api/health            → Health check
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow frontend (Vite dev server) to connect
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  })
);

// Parse JSON request bodies (up to 10MB for large question sets)
app.use(express.json({ limit: '10mb' }));

// Request logging (simple)
app.use((req, res, next) => {
  if (req.path !== '/api/health' && !req.path.includes('/api/sessions/')) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/sessions', sessionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/analyze', analyzeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ────────────────────────────────────────────────────────────

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  // Then start Express
  app.listen(PORT, () => {
    console.log(`\n🔥 AI Audit Engine Backend`);
    console.log(`   Server:  http://localhost:${PORT}`);
    console.log(`   Health:  http://localhost:${PORT}/api/health`);
    console.log(`   Ready to receive audit requests!\n`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});