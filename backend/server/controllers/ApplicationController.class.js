import Application from '../models/Application.js';
import Job from '../models/Job.js';

/**
 * ApplicationController handles job application operations
 */
class ApplicationController {
  /**
   * Apply for a job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async applyForJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Check if job exists and is active
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.status !== 'active') {
        return res.status(400).json({ error: 'This job is not accepting applications' });
      }

      // Check if user already applied
      const existingApplication = await Application.findOne({ userId, jobId });
      if (existingApplication) {
        if (existingApplication.status === 'withdrawn') {
          // Reactivate withdrawn application
          existingApplication.status = 'applied';
          existingApplication.appliedAt = new Date();
          existingApplication.withdrawnAt = null;
          await existingApplication.save();
          return res.json({ 
            message: 'Application resubmitted successfully', 
            application: existingApplication 
          });
        }
        return res.status(400).json({ error: 'You have already applied for this job' });
      }

      // Create new application
      const application = new Application({
        userId,
        jobId,
        status: 'applied'
      });

      await application.save();
      res.status(201).json({ 
        message: 'Application submitted successfully', 
        application 
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Withdraw application
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async withdrawApplication(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const application = await Application.findOne({ userId, jobId });
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      if (application.status === 'withdrawn') {
        return res.status(400).json({ error: 'Application already withdrawn' });
      }

      application.status = 'withdrawn';
      application.withdrawnAt = new Date();
      await application.save();

      res.json({ 
        message: 'Application withdrawn successfully', 
        application 
      });
    } catch (error) {
      console.error('Error withdrawing application:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get application status for a job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getApplicationStatus(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const application = await Application.findOne({ userId, jobId });
      
      if (!application) {
        return res.json({ applied: false, status: null });
      }

      res.json({ 
        applied: application.status !== 'withdrawn',
        status: application.status,
        appliedAt: application.appliedAt,
        withdrawnAt: application.withdrawnAt
      });
    } catch (error) {
      console.error('Error getting application status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all applications for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserApplications(req, res) {
    try {
      const userId = req.user.id;

      const applications = await Application.find({ userId })
        .populate('jobId')
        .sort({ appliedAt: -1 });

      res.json(applications);
    } catch (error) {
      console.error('Error getting user applications:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all applications for a job (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getJobApplications(req, res) {
    try {
      const { jobId } = req.params;

      const applications = await Application.find({ jobId })
        .populate('userId', 'fullName email')
        .sort({ appliedAt: -1 });

      res.json(applications);
    } catch (error) {
      console.error('Error getting job applications:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ApplicationController();
