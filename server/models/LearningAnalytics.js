import mongoose from 'mongoose';

// Schema để lưu phân tích học tập của từng user
const learningAnalyticsSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    required: true 
  },
  
  // Quiz performance
  quizAttempts: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt' },
    score: { type: Number },
    totalQuestions: { type: Number },
    percentage: { type: Number },
    attemptDate: { type: Date, default: Date.now },
    timeSpent: { type: Number } // in seconds
  }],
  
  // Progress tracking
  progress: {
    completedLectures: [{ type: String }], // lectureIds
    currentChapterId: { type: String },
    currentLectureId: { type: String },
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessedDate: { type: Date, default: Date.now }
  },
  
  // Learning patterns
  learningPattern: {
    averageQuizScore: { type: Number, default: 0 },
    totalQuizzesTaken: { type: Number, default: 0 },
    quizRetakeCount: { type: Number, default: 0 },
    weakTopics: [{ type: String }], // Topics where score < 5
    strongTopics: [{ type: String }], // Topics where score > 8
    learningLevel: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  
  // Personalization data
  recommendations: {
    suggestedCourses: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course' 
    }],
    nextLessons: [{ type: String }], // lectureIds
    reviewTopics: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now }
  }
}, { timestamps: true });

// Compound index for faster queries
learningAnalyticsSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const LearningAnalytics = mongoose.model('LearningAnalytics', learningAnalyticsSchema);

export default LearningAnalytics;
