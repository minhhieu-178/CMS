import Stripe from 'stripe'
import Payment from '../models/Payment.js'
import Course from '../models/Course.js'

const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null

// Create payment order
export const createPaymentOrder = async (req, res) => {
    try {
        if (!stripe) {
            return res.json({ success: false, message: 'Payment gateway not configured' })
        }

        const { courseId } = req.body
        const studentId = req.auth.userId

        const course = await Course.findById(courseId)
        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Calculate final price with discount
        const finalPrice = course.coursePrice - (course.coursePrice * course.discount / 100)

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: course.courseTitle,
                        description: course.courseDescription.substring(0, 200),
                        images: [course.courseThumbnail]
                    },
                    unit_amount: Math.round(finalPrice * 100) // Convert to cents
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/course/${courseId}`,
            metadata: {
                courseId: courseId.toString(),
                studentId
            }
        })

        // Create payment record
        const payment = await Payment.create({
            studentId,
            courseId,
            amount: finalPrice,
            currency: 'USD',
            paymentGateway: 'stripe',
            orderId: session.id,
            status: 'pending'
        })

        res.json({ 
            success: true, 
            sessionId: session.id,
            sessionUrl: session.url,
            payment 
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Verify payment (Stripe webhook)
export const verifyPayment = async (req, res) => {
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object

        // Update payment status
        await Payment.findOneAndUpdate(
            { orderId: session.id },
            { 
                status: 'completed',
                paymentId: session.payment_intent,
                transactionDate: new Date()
            }
        )

        // Auto-enroll student (this should trigger enrollment controller)
        // Or handle enrollment here directly
    }

    res.json({ received: true })
}

// Get payment history
export const getPaymentHistory = async (req, res) => {
    try {
        const studentId = req.auth.userId

        const payments = await Payment.find({ studentId })
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ createdAt: -1 })

        res.json({ success: true, payments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
