import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  keywords: {
    type: [String],
    default: []
  },
  searchableTitle: {
    type: String,
    default: function() {
      return this.title ? this.title.toLowerCase() : '';
    }
  }
});

// Create text indexes for full-text search with weights
jobSchema.index({ 
  title: 'text', 
  department: 'text', 
  location: 'text', 
  description: 'text', 
  requirements: 'text',
  keywords: 'text'
}, {
  weights: {
    title: 10,
    department: 5,
    location: 5,
    keywords: 8,
    description: 3,
    requirements: 3
  },
  name: "JobTextIndex"
});

// Create regular indexes for exact matching
jobSchema.index({ title: 1 });
jobSchema.index({ searchableTitle: 1 });
jobSchema.index({ department: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', jobSchema);