import express from 'express';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';

const router = express.Router();

// Admin Dashboard Stats
router.get('/admin', async (req, res) => {
  try {
    // Get total jobs count
    const totalJobs = await Job.countDocuments();
    
    // Get active jobs count
    const activeJobs = await Job.countDocuments({ status: 'active' });
    
    // Get total candidates count
    const totalCandidates = await Candidate.countDocuments();
    
    // Get interviews scheduled count
    const interviewsScheduled = await Candidate.countDocuments({ interviewScheduled: true });
    
    // Get jobs by status
    const jobsByStatus = {
      active: await Job.countDocuments({ status: 'active' }),
      draft: await Job.countDocuments({ status: 'draft' }),
      closed: await Job.countDocuments({ status: 'closed' })
    };
    
    // Get recent jobs with candidate count
    const recentJobs = await Job.aggregate([
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: 'jobId',
          as: 'candidates'
        }
      },
      {
        $project: {
          title: 1,
          department: 1,
          status: 1,
          createdAt: 1,
          candidateCount: { $size: '$candidates' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      totalJobs,
      activeJobs,
      totalCandidates,
      interviewsScheduled,
      jobsByStatus,
      recentJobs
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// User Dashboard Stats
router.get('/user', async (req, res) => {
  try {
    // For now, return mock data since we don't have user-specific applications
    // In a real app, you'd filter by user ID from authentication
    
    const totalApplications = await Candidate.countDocuments();
    const activeApplications = await Candidate.countDocuments({ 
      interviewScheduled: false 
    });
    const interviewsScheduled = await Candidate.countDocuments({ 
      interviewScheduled: true 
    });
    
    // Calculate average match score
    const avgScoreResult = await Candidate.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$atsScore' }
        }
      }
    ]);
    
    const avgMatchScore = avgScoreResult.length > 0 
      ? Math.round(avgScoreResult[0].avgScore) 
      : 0;
    
    // Application status breakdown
    const applicationsByStatus = {
      pending: await Candidate.countDocuments({ interviewScheduled: false }),
      interviewed: await Candidate.countDocuments({ interviewScheduled: true }),
      rejected: 0 // This would need a status field in the Candidate model
    };
    
    // Get recent applications
    const recentApplications = await Candidate.find()
      .populate('jobId', 'title department company')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    res.json({
      totalApplications,
      activeApplications,
      interviewsScheduled,
      avgMatchScore,
      applicationsByStatus,
      recentApplications
    });
  } catch (error) {
    console.error('Error fetching user dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
