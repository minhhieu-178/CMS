import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: mongoose.Schema.Types.Mixed, // Can be string, array, or boolean
  isCorrect: Boolean,
  pointsEarned: Number
})

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  userId: {
    type: String, // Clerk user ID
    required: true
  },
  answers: [answerSchema],
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    required: true
  },
  timeSpent: Number // in seconds
}, {
  timestamps: true
})

// Index for faster queries
quizAttemptSchema.index({ quizId: 1, userId: 1 })
quizAttemptSchema.index({ userId: 1, createdAt: -1 })

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema)

export default QuizAttempt
