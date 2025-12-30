import express from 'express'
import { addRating, getCourseRatings, updateRating, deleteRating } from '../controllers/ratingController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const ratingRouter = express.Router()

// Public route
ratingRouter.get('/:courseId', getCourseRatings)

// Protected routes
ratingRouter.post('/add', requireAuth, addRating)
ratingRouter.put('/update', requireAuth, updateRating)
ratingRouter.delete('/:courseId', requireAuth, deleteRating)

export default ratingRouter
