import { clerkClient } from '@clerk/express'
import Course from '../models/Course.js'
import Enrollment from '../models/Enrollment.js'
import Payment from '../models/Payment.js'
import { v2 as cloudinary } from 'cloudinary'

// update role to educator
export const updateRoleToEducator = async (req, res)=>{
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata:{
                role: 'educator',
            }
        })

        res.json({ success: true, message: 'You can publish a course now' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// add new course
export const addCourse = async (req, res)=>{
    try {
        const { courseData } = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if(!imageFile){
            return res.json({ success: false, message: 'Thumbnail Not Attached'})
        }

        const parsedCourseData = JSON.parse(courseData)
        parsedCourseData.educator = educatorId
        
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        parsedCourseData.courseThumbnail = imageUpload.secure_url
        
        const newCourse = await Course.create(parsedCourseData)
        
        // Populate educator info
        const populatedCourse = await Course.findById(newCourse._id).populate('educator', 'name email imageUrl')

        res.json({ 
            success: true, 
            message: 'Course Added', 
            course: populatedCourse 
        })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res)=>{
    try {
        const educator = req.auth.userId

        const courses = await Course.find({ educator: educator }).populate('educator', 'name email imageUrl')
        res.json({ success: true, courses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Update course
export const updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params
        const { courseData } = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        const course = await Course.findById(courseId)
        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        if (course.educator !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized' })
        }

        const parsedCourseData = JSON.parse(courseData)

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path)
            parsedCourseData.courseThumbnail = imageUpload.secure_url
        }

        await Course.findByIdAndUpdate(courseId, parsedCourseData)

        res.json({ success: true, message: 'Course updated successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Delete course
export const deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params
        const educatorId = req.auth.userId

        const course = await Course.findById(courseId)
        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        if (course.educator !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized' })
        }

        await Course.findByIdAndDelete(courseId)

        res.json({ success: true, message: 'Course deleted successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get educator dashboard
export const getEducatorDashboard = async (req, res) => {
    try {
        const educatorId = req.auth.userId

        // Get all courses by educator
        const courses = await Course.find({ educator: educatorId })
        const courseIds = courses.map(c => c._id)

        // Get total enrollments
        const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
            .populate('studentId', 'name email imageUrl')
            .populate('courseId', 'courseTitle')

        // Get total earnings
        const payments = await Payment.find({ 
            courseId: { $in: courseIds },
            status: 'completed'
        })
        const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0)

        res.json({
            success: true,
            data: {
                totalCourses: courses.length,
                totalEarnings: totalEarnings.toFixed(2),
                enrolledStudentsData: enrollments,
                totalCoursses: courses.length // Keep typo for compatibility with frontend
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get students enrolled in educator's courses
export const getEnrolledStudents = async (req, res) => {
    try {
        const educatorId = req.auth.userId
        const { courseId } = req.query

        let query = {}
        
        if (courseId) {
            // Get students for specific course
            const course = await Course.findById(courseId)
            if (course.educator !== educatorId) {
                return res.json({ success: false, message: 'Unauthorized' })
            }
            query.courseId = courseId
        } else {
            // Get students for all educator's courses
            const courses = await Course.find({ educator: educatorId })
            const courseIds = courses.map(c => c._id)
            query.courseId = { $in: courseIds }
        }

        const enrollments = await Enrollment.find(query)
            .populate('studentId', 'name email imageUrl')
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ enrollmentDate: -1 })

        res.json({ success: true, enrollments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}