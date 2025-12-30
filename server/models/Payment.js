import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    studentId: { type: String, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentGateway: { type: String, enum: ['stripe', 'razorpay', 'paypal'], default: 'stripe' },
    paymentId: { type: String },
    orderId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionDate: { type: Date, default: Date.now },
    invoiceUrl: { type: String }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
