import express from 'express'
import { getAllCourses, getCourseDetails, getEnrolledCourses, getStudentDashboard, getUserProfile, becomeEducator } from '../controllers/studentController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const studentRouter = express.Router()

// Public routes
studentRouter.get('/courses', getAllCourses)
studentRouter.get('/courses/:courseId', getCourseDetails)

// Protected routes
studentRouter.get('/profile', requireAuth, getUserProfile)
studentRouter.post('/become-educator', requireAuth, becomeEducator)
studentRouter.get('/my-courses', requireAuth, getEnrolledCourses)
studentRouter.get('/dashboard', requireAuth, getStudentDashboard)

export default studentRouter
