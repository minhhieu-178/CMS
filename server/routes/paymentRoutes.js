import express from 'express'
import { createPaymentOrder, verifyPayment, getPaymentHistory } from '../controllers/paymentController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const paymentRouter = express.Router()

paymentRouter.post('/create-order', requireAuth, createPaymentOrder)
paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), verifyPayment)
paymentRouter.get('/history', requireAuth, getPaymentHistory)

export default paymentRouter
