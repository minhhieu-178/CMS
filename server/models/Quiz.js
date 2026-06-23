import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank'],
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String, // For fill-blank questions
  points: {
    type: Number,
    default: 1
  },
  order: Number
})

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  chapterIndex: {
    type: Number,
    required: true
  },
  lectureIndex: Number, // Optional: quiz for specific lecture
  title: {
    type: String,
    required: true
  },
  description: String,
  questions: [questionSchema],
  settings: {
    timeLimit: {
      type: Number, // in minutes
      default: 30
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    passingScore: {
      type: Number, // percentage
      default: 70
    },
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    },
    showAnswersAfterSubmit: {
      type: Boolean,
      default: true
    },
    showAnswersAfterDeadline: {
      type: Boolean,
      default: true
    },
    deadline: Date
  },
  createdBy: {
    type: String, // Clerk user ID
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

const Quiz = mongoose.model('Quiz', quizSchema)

export default Quiz
