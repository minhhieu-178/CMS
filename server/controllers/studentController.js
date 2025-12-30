import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'
import User from '../models/User.js'
import { clerkClient } from '@clerk/express'

// Get user profile and role
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.auth.userId
        let user = await User.findById(userId)
        
        if (!user) {
            // User not found in DB yet (webhook might be delayed)
            // Create user with default role
            const clerkUser = await clerkClient.users.getUser(userId)
            user = await User.create({
                _id: userId,
                email: clerkUser.emailAddresses[0].emailAddress,
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
                imageUrl: clerkUser.imageUrl,
                role: clerkUser.publicMetadata?.role || 'student'
            })
        }

        res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Request to become educator
export const becomeEducator = async (req, res) => {
    try {
        const userId = req.auth.userId

        // Update role in MongoDB
        const user = await User.findByIdAndUpdate(
            userId,
            { role: 'educator' },
            { new: true }
        )

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        // Update role in Clerk metadata
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator'
            }
        })

        res.json({ success: true, message: 'You are now an educator!', user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get all published courses
export const getAllCourses = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query
        
        const query = { isPublished: true }
        
        if (search) {
            // First, find users whose names match the search term
            const matchingUsers = await User.find({
                name: { $regex: search, $options: 'i' }
            }).select('_id')
            
            const matchingUserIds = matchingUsers.map(user => user._id)
            
            // Search in course title, description, or educator name
            query.$or = [
                { courseTitle: { $regex: search, $options: 'i' } },
                { courseDescription: { $regex: search, $options: 'i' } },
                { educator: { $in: matchingUserIds } }
            ]
        }

        const courses = await Course.find(query)
            .populate('educator', 'name email imageUrl')
            .select('-courseContent.chapterContent.lectureUrl')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })

        const count = await Course.countDocuments(query)

        res.json({
            success: true,
            courses,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get course details
export const getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params
        const userId = req.auth?.userId

        const course = await Course.findById(courseId)
        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Check if user is enrolled
        let isEnrolled = false
        if (userId) {
            const enrollment = await Enrollment.findOne({ studentId: userId, courseId })
            isEnrolled = !!enrollment
        }

        // If not enrolled, hide non-preview lectures
        if (!isEnrolled) {
            course.courseContent = course.courseContent.map(chapter => ({
                ...chapter.toObject(),
                chapterContent: chapter.chapterContent.map(lecture => 
                    lecture.isPreviewFree 
                        ? lecture 
                        : { ...lecture.toObject(), lectureUrl: null }
                )
            }))
        }

        res.json({ success: true, course, isEnrolled })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get enrolled courses
export const getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId

        const enrollments = await Enrollment.find({ studentId: userId, status: 'active' })
            .populate('courseId')
            .sort({ enrollmentDate: -1 })

        res.json({ success: true, enrollments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get student dashboard
export const getStudentDashboard = async (req, res) => {
    try {
        const userId = req.auth.userId

        const totalEnrollments = await Enrollment.countDocuments({ studentId: userId })
        const completedCourses = await Enrollment.countDocuments({ 
            studentId: userId, 
            'progress.completionPercentage': 100 
        })
        
        const recentEnrollments = await Enrollment.find({ studentId: userId })
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ enrollmentDate: -1 })
            .limit(5)

        res.json({
            success: true,
            data: {
                totalEnrollments,
                completedCourses,
                inProgress: totalEnrollments - completedCourses,
                recentEnrollments
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
