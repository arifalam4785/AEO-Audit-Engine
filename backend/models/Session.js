import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    questions: {
      type: [String],
      required: true,
    },

    questionCount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['running', 'completed', 'cancelled', 'error'],
      default: 'running',
    },

    progress: {
      claude: { type: Number, default: 0 },
      chatgpt: { type: Number, default: 0 },
      gemini: { type: Number, default: 0 },
      activePlatform: { type: String, default: null },
      donePlatforms: { type: [String], default: [] },
    },

    auditErrors: [
      {
        platform: String,
        questionIndex: Number,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);
export default Session;