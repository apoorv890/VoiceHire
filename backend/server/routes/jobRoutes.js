import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import JobController from '../controllers/JobController.class.js';

const router = express.Router();

// Public routes
router.get('/', (req, res) => JobController.getAllJobs(req, res));
router.get('/:id', (req, res) => JobController.getJobById(req, res));

// Admin only routes
router.post('/', authenticate, requireAdmin, (req, res) => JobController.createJob(req, res));
router.put('/:id', authenticate, requireAdmin, (req, res) => JobController.updateJob(req, res));
router.patch('/:id/status', authenticate, requireAdmin, (req, res) => JobController.updateJobStatus(req, res));
router.delete('/:id', authenticate, requireAdmin, (req, res) => JobController.deleteJob(req, res));

export default router;
