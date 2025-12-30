import Enrollment from '../models/Enrollment.js'
import Course from '../models/Course.js'
import User from '../models/User.js'

// Enroll in course
export const enrollCourse = async (req, res) => {
    try {
        const { courseId, paymentId, amount } = req.body
        const studentId = req.auth.userId

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId })
        if (existingEnrollment) {
            return res.json({ success: false, message: 'Already enrolled in this course' })
        }

        // Check if course exists
        const course = await Course.findById(courseId)
        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            studentId,
            courseId,
            paymentId,
            amount,
            status: 'active'
        })

        // Add to course enrolledStudents
        await Course.findByIdAndUpdate(courseId, {
            $addToSet: { enrolledStudents: studentId }
        })

        // Add to user enrolledCourses
        await User.findByIdAndUpdate(studentId, {
            $addToSet: { enrolledCourses: courseId }
        })

        res.json({ success: true, message: 'Enrolled successfully', enrollment })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Check enrollment status
export const checkEnrollmentStatus = async (req, res) => {
    try {
        const { courseId } = req.params
        const studentId = req.auth.userId

        const enrollment = await Enrollment.findOne({ studentId, courseId })
        
        res.json({ 
            success: true, 
            isEnrolled: !!enrollment,
            enrollment 
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get course progress
export const getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params
        const studentId = req.auth.userId

        const enrollment = await Enrollment.findOne({ studentId, courseId })
        if (!enrollment) {
            return res.json({ success: false, message: 'Not enrolled in this course' })
        }

        res.json({ success: true, progress: enrollment.progress })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Mark lecture as complete
export const markLectureComplete = async (req, res) => {
    try {
        const { courseId, lectureId } = req.body
        const studentId = req.auth.userId

        const enrollment = await Enrollment.findOne({ studentId, courseId })
        if (!enrollment) {
            return res.json({ success: false, message: 'Not enrolled in this course' })
        }

        // Add lecture to completed if not already there
        if (!enrollment.progress.lecturesCompleted.includes(lectureId)) {
            enrollment.progress.lecturesCompleted.push(lectureId)
        }

        // Calculate completion percentage
        const course = await Course.findById(courseId)
        let totalLectures = 0
        course.courseContent.forEach(chapter => {
            totalLectures += chapter.chapterContent.length
        })

        enrollment.progress.completionPercentage = 
            Math.round((enrollment.progress.lecturesCompleted.length / totalLectures) * 100)
        
        enrollment.progress.lastAccessedDate = new Date()
        await enrollment.save()

        res.json({ success: true, progress: enrollment.progress })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
