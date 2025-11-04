import Job from '../models/Job.js';

/**
 * JobController class handles all job-related operations
 */
class JobController {
  /**
   * Get all jobs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllJobs(req, res) {
    try {
      const jobs = await Job.find().sort({ createdAt: -1 });
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get specific job by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getJobById(req, res) {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new job (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createJob(req, res) {
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
  }

  /**
   * Update a job (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateJob(req, res) {
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
  }

  /**
   * Update job status only (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateJobStatus(req, res) {
    try {
      const { status } = req.body;
      
      if (!status || !['draft', 'active', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be draft, active, or closed' });
      }
      
      const job = await Job.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json(job);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete a job (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteJob(req, res) {
    try {
      const job = await Job.findByIdAndDelete(req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// Export a singleton instance
export default new JobController();
