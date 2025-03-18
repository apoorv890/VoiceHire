import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  atsScore: {
    type: Number,
    required: true
  },
  matchExplanation: {
    type: String,
    default: ''
  },
  resumeText: {
    type: String,
    default: ''
  },
  resumeUrl: {
    type: String,
    required: true
  },
  callScheduled: {
    type: Boolean,
    default: false
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Candidate', candidateSchema);