import Enrollment from '../models/Enrollment.js'
import Course from '../models/Course.js'

// Migration endpoint - should be protected and only accessible by admin
export const migrateEnrollmentsFromClient = async (req, res) => {
    try {
        const { enrollments } = req.body // Array of enrollments from client
        
        if (!Array.isArray(enrollments)) {
            return res.json({ success: false, message: 'Invalid data format' })
        }

        let migrated = 0
        let skipped = 0
        let errors = []

        for (const enrollment of enrollments) {
            try {
                const { studentId, courseId, enrolledAt, enrollmentType } = enrollment

                // Check if already exists
                const existing = await Enrollment.findOne({ studentId, courseId })
                if (existing) {
                    skipped++
                    continue
                }

                // Verify course exists
                const course = await Course.findById(courseId)
                if (!course) {
                    errors.push(`Course not found: ${courseId}`)
                    continue
                }

                // Create enrollment
                await Enrollment.create({
                    studentId,
                    courseId,
                    enrolledAt: enrolledAt || new Date(),
                    enrollmentType: enrollmentType || 'Free',
                    amount: 0,
                    status: 'active'
                })

                // Update course enrolledStudents
                await Course.findByIdAndUpdate(courseId, {
                    $addToSet: { enrolledStudents: studentId }
                })

                migrated++
            } catch (error) {
                errors.push(`Error: ${error.message}`)
            }
        }

        res.json({
            success: true,
            message: 'Migration completed',
            stats: {
                total: enrollments.length,
                migrated,
                skipped,
                errors: errors.length
            },
            errors
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
