import express from 'express';
import {
  getPersonalizedDashboard,
  getCourseRecommendations,
  checkLessonAccess,
  updateLectureProgress,
  getLearningAnalytics,
  getAllUserAnalytics,
  analyzeQuizPerformance
} from '../controllers/personalizationController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const personalizationRouter = express.Router();

// All routes require authentication
personalizationRouter.use(requireAuth);

// Get personalized dashboard for a course
personalizationRouter.get('/dashboard/:courseId', getPersonalizedDashboard);

// Get course recommendations based on learning level
personalizationRouter.get('/recommendations/:courseId', getCourseRecommendations);

// Check if user can access next lesson
personalizationRouter.get('/check-access/:courseId/:lectureId', checkLessonAccess);

// Update lecture progress
personalizationRouter.post('/progress', updateLectureProgress);

// Get learning analytics for a course
personalizationRouter.get('/analytics/:courseId', getLearningAnalytics);

// Get all user analytics (for overall dashboard)
personalizationRouter.get('/analytics', getAllUserAnalytics);

// Analyze quiz performance and get recommendations
personalizationRouter.post('/analyze-quiz', analyzeQuizPerformance);

export default personalizationRouter;
