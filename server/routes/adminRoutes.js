import express from 'express';
import { getAdminAnalytics } from '../controllers/adminController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const adminRouter = express.Router();

// All admin routes require authentication
// Additional admin role check should be done in Clerk metadata

adminRouter.get('/analytics', requireAuth, getAdminAnalytics);

export default adminRouter;
