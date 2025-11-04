import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  resume: {
    fileUrl: {
      type: String,
      default: null
    },
    s3Key: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileType: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['applied', 'withdrawn', 'under_review', 'accepted', 'rejected'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  withdrawnAt: {
    type: Date,
    default: null
  }
});

// Compound index to ensure one application per user per job
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ userId: 1 });
applicationSchema.index({ status: 1 });

export default mongoose.model('Application', applicationSchema);
