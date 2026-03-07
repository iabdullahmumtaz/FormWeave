import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    form: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    meta: {
      userAgent: String,
      completedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Submission', submissionSchema);
