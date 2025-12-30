import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhook.js'
import educatorRouter from './routes/educatorRoutes.js'
import studentRouter from './routes/studentRoutes.js'
import enrollmentRouter from './routes/enrollmentRoutes.js'
import ratingRouter from './routes/ratingRoutes.js'
import paymentRouter from './routes/paymentRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import connectCloudinary from './configs/cloudinary.js'

//Initialize Express
const app = express()

//Connect Database
await connectDB()
await connectCloudinary()

//Middlewares
// Temporary: Allow all origins for debugging
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Production CORS (uncomment when ready):
// const allowedOrigins = [
//   'http://localhost:5173',
//   'http://localhost:5174',
//   'https://cms-4x0wdwa4m-hieus-projects-c189a49e.vercel.app',
//   process.env.CLIENT_URL
// ].filter(Boolean)
// 
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true)
//     if (allowedOrigins.includes(origin)) {
//       callback(null, true)
//     } else {
//       console.log('CORS blocked origin:', origin)
//       callback(new Error('Not allowed by CORS'))
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }))

app.use(express.json())
app.use(clerkMiddleware())

//Routes
app.get('/', (req, res)=> res.send("API Working"))
app.get('/api/test', (req, res)=> res.json({ success: true, message: 'API is working!' }))

// Webhooks (must be before express.json())
app.post('/api/webhooks/clerk', express.raw({ type: 'application/json' }), clerkWebhooks)

// API Routes
app.use('/api/educator', educatorRouter)
app.use('/api/student', studentRouter)
app.use('/api/enrollment', enrollmentRouter)
app.use('/api/ratings', ratingRouter)
app.use('/api/payment', paymentRouter)

//PORT
const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})