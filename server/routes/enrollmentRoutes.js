import express from 'express'
import { enrollCourse, checkEnrollmentStatus, getCourseProgress, markLectureComplete, getMyEnrollments } from '../controllers/enrollmentController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const enrollmentRouter = express.Router()

// All routes require authentication
enrollmentRouter.post('/enroll', requireAuth, enrollCourse)
enrollmentRouter.get('/check/:courseId', requireAuth, checkEnrollmentStatus)
enrollmentRouter.get('/status/:courseId', requireAuth, checkEnrollmentStatus)
enrollmentRouter.get('/progress/:courseId', requireAuth, getCourseProgress)
enrollmentRouter.post('/mark-complete', requireAuth, markLectureComplete)
enrollmentRouter.get('/my-enrollments', requireAuth, getMyEnrollments)

export default enrollmentRouter
