import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    studentId: { type: String, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentDate: { type: Date, default: Date.now },
    paymentId: { type: String },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    progress: {
        lecturesCompleted: [{ type: String }],
        completionPercentage: { type: Number, default: 0 },
        lastAccessedDate: { type: Date }
    }
}, { timestamps: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
