import Enrollment from '../models/Enrollment.js'
import Course from '../models/Course.js'
import User from '../models/User.js'
import LearningAnalytics from '../models/LearningAnalytics.js'

// Enroll in course (free or creator)
export const enrollCourse = async (req, res) => {
    try {
        const { courseId, paymentId, amount, enrollmentType = 'demo' } = req.body
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
            amount: amount || 0,
            status: 'active',
            enrollmentType
        })

        // Add to course enrolledStudents
        await Course.findByIdAndUpdate(courseId, {
            $addToSet: { enrolledStudents: studentId }
        })

        // Add to user enrolledCourses
        await User.findByIdAndUpdate(studentId, {
            $addToSet: { enrolledCourses: courseId }
        })

        // Create initial LearningAnalytics record
        try {
            await LearningAnalytics.create({
                userId: studentId,
                courseId,
                progress: {
                    completedLectures: [],
                    overallProgress: 0,
                    lastAccessedDate: new Date()
                },
                learningPattern: {
                    averageQuizScore: 0,
                    totalQuizzesTaken: 0,
                    quizRetakeCount: 0,
                    weakTopics: [],
                    strongTopics: [],
                    learningLevel: 'beginner'
                },
                recommendations: {
                    suggestedCourses: [],
                    nextLessons: [],
                    reviewTopics: [],
                    lastUpdated: new Date()
                }
            })
            console.log('✅ Created initial LearningAnalytics for user:', studentId)
        } catch (analyticsError) {
            // If analytics already exists (edge case), just log warning
            console.log('⚠️ LearningAnalytics may already exist:', analyticsError.message)
        }

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

// Get my enrollments
export const getMyEnrollments = async (req, res) => {
    try {
        const studentId = req.auth.userId

        const enrollments = await Enrollment.find({ studentId })
            .populate('courseId')
            .sort({ enrolledAt: -1 })

        // Map to include course data
        const enrollmentsWithCourses = enrollments.map(enrollment => ({
            ...enrollment.toObject(),
            course: enrollment.courseId
        }))

        res.json({ 
            success: true, 
            enrollments: enrollmentsWithCourses 
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Migrate existing enrollments to LearningAnalytics (one-time migration)
export const migrateEnrollmentsToAnalytics = async (req, res) => {
    try {
        console.log('🔄 Starting enrollment to analytics migration...')
        
        // Get all enrollments
        const allEnrollments = await Enrollment.find({})
        console.log(`📚 Found ${allEnrollments.length} total enrollments`)
        
        let created = 0
        let skipped = 0
        let errors = 0
        
        for (const enrollment of allEnrollments) {
            try {
                // Check if LearningAnalytics already exists
                const existing = await LearningAnalytics.findOne({
                    userId: enrollment.studentId,
                    courseId: enrollment.courseId
                })
                
                if (existing) {
                    skipped++
                    continue
                }
                
                // Create new LearningAnalytics
                await LearningAnalytics.create({
                    userId: enrollment.studentId,
                    courseId: enrollment.courseId,
                    progress: {
                        completedLectures: enrollment.progress?.lecturesCompleted || [],
                        overallProgress: enrollment.progress?.completionPercentage || 0,
                        lastAccessedDate: enrollment.progress?.lastAccessedDate || enrollment.enrollmentDate || new Date()
                    },
                    learningPattern: {
                        averageQuizScore: 0,
                        totalQuizzesTaken: 0,
                        quizRetakeCount: 0,
                        weakTopics: [],
                        strongTopics: [],
                        learningLevel: 'beginner'
                    },
                    recommendations: {
                        suggestedCourses: [],
                        nextLessons: [],
                        reviewTopics: [],
                        lastUpdated: new Date()
                    }
                })
                
                created++
                console.log(`✅ Created analytics for user ${enrollment.studentId}, course ${enrollment.courseId}`)
                
            } catch (error) {
                errors++
                console.error(`❌ Error processing enrollment ${enrollment._id}:`, error.message)
            }
        }
        
        console.log('✅ Migration complete!')
        console.log(`   Created: ${created}`)
        console.log(`   Skipped (already exists): ${skipped}`)
        console.log(`   Errors: ${errors}`)
        
        res.json({
            success: true,
            message: 'Migration completed',
            stats: { created, skipped, errors, total: allEnrollments.length }
        })
        
    } catch (error) {
        console.error('❌ Migration failed:', error)
        res.json({ success: false, message: error.message })
    }
}
