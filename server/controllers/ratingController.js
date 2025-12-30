import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'

// Add rating to course
export const addRating = async (req, res) => {
    try {
        const { courseId, rating, review } = req.body
        const userId = req.auth.userId

        // Check if enrolled
        const enrollment = await Enrollment.findOne({ studentId: userId, courseId })
        if (!enrollment) {
            return res.json({ success: false, message: 'You must be enrolled to rate this course' })
        }

        // Check if already rated
        const course = await Course.findById(courseId)
        const existingRating = course.courseRatings.find(r => r.userId === userId)
        
        if (existingRating) {
            return res.json({ success: false, message: 'You have already rated this course' })
        }

        // Add rating
        course.courseRatings.push({ userId, rating, review })
        await course.save()

        res.json({ success: true, message: 'Rating added successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get course ratings
export const getCourseRatings = async (req, res) => {
    try {
        const { courseId } = req.params

        const course = await Course.findById(courseId).select('courseRatings')
        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Calculate average rating
        const totalRatings = course.courseRatings.length
        const avgRating = totalRatings > 0
            ? course.courseRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
            : 0

        res.json({ 
            success: true, 
            ratings: course.courseRatings,
            averageRating: avgRating.toFixed(1),
            totalRatings
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Update rating
export const updateRating = async (req, res) => {
    try {
        const { courseId, rating, review } = req.body
        const userId = req.auth.userId

        const course = await Course.findById(courseId)
        const ratingIndex = course.courseRatings.findIndex(r => r.userId === userId)

        if (ratingIndex === -1) {
            return res.json({ success: false, message: 'Rating not found' })
        }

        course.courseRatings[ratingIndex] = { userId, rating, review }
        await course.save()

        res.json({ success: true, message: 'Rating updated successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Delete rating
export const deleteRating = async (req, res) => {
    try {
        const { courseId } = req.params
        const userId = req.auth.userId

        const course = await Course.findById(courseId)
        course.courseRatings = course.courseRatings.filter(r => r.userId !== userId)
        await course.save()

        res.json({ success: true, message: 'Rating deleted successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
