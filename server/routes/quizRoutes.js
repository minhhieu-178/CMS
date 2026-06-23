import express from 'express'
import {
  createQuiz,
  getQuiz,
  submitQuizAttempt,
  getMyAttempts,
  getAttemptDetails,
  getCourseQuizzes,
  getStudentQuizzes,
  updateQuiz,
  deleteQuiz,
  getQuizAnalytics,
  getCourseAttempts
} from '../controllers/quizController.js'
import { requireAuth } from '@clerk/express'

const quizRouter = express.Router()

// Educator routes
quizRouter.post('/create', requireAuth(), createQuiz)
quizRouter.get('/course/:courseId', requireAuth(), getCourseQuizzes)
quizRouter.put('/:quizId', requireAuth(), updateQuiz)
quizRouter.delete('/:quizId', requireAuth(), deleteQuiz)
quizRouter.get('/:quizId/analytics', requireAuth(), getQuizAnalytics)

// Student routes
quizRouter.get('/course/:courseId/student', requireAuth(), getStudentQuizzes)
quizRouter.get('/course/:courseId/attempts', requireAuth(), getCourseAttempts)
quizRouter.get('/:quizId', requireAuth(), getQuiz)
quizRouter.post('/submit', requireAuth(), submitQuizAttempt)
quizRouter.get('/:quizId/attempts', requireAuth(), getMyAttempts)
quizRouter.get('/attempt/:attemptId', requireAuth(), getAttemptDetails)

export default quizRouter
