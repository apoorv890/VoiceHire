import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import ApplicationController from '../controllers/ApplicationController.class.js';

const router = express.Router();

// User routes
router.post('/job/:jobId/apply', authenticate, (req, res) => ApplicationController.applyForJob(req, res));
router.delete('/job/:jobId/withdraw', authenticate, (req, res) => ApplicationController.withdrawApplication(req, res));
router.get('/job/:jobId/status', authenticate, (req, res) => ApplicationController.getApplicationStatus(req, res));
router.get('/my-applications', authenticate, (req, res) => ApplicationController.getUserApplications(req, res));

// Admin routes
router.get('/job/:jobId/all', authenticate, requireAdmin, (req, res) => ApplicationController.getJobApplications(req, res));

export default router;
