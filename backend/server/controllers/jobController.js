import Job from '../models/Job.js';

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific job by ID
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new job (Admin only)
export const createJob = async (req, res) => {
  try {
    const { title, department, location, description, requirements, status } = req.body;
    
    if (!title || !department || !location || !description || !requirements) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const job = new Job({
      title,
      department,
      location,
      description,
      requirements,
      status: status || 'draft'
    });
    
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(400).json({ error: error.message });
  }
};

// Update a job (Admin only)
export const updateJob = async (req, res) => {
  try {
    const { title, department, location, description, requirements, status } = req.body;
    
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { title, department, location, description, requirements, status },
      { new: true, runValidators: true }
    );
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a job (Admin only)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
