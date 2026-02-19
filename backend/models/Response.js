import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: ['claude', 'chatgpt', 'gemini'],
      required: true,
    },

    questionIndex: {
      type: Number,
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    answer: {
      type: String,
      default: '',
    },

    isError: {
      type: Boolean,
      default: false,
    },

    responseTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

responseSchema.index({ sessionId: 1, platform: 1, questionIndex: 1 });

const Response = mongoose.model('Response', responseSchema);
export default Response;