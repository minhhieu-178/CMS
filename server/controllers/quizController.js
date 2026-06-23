import Quiz from '../models/Quiz.js'
import QuizAttempt from '../models/QuizAttempt.js'
import PersonalizationService from '../services/personalizationService.js'

// Create Quiz (Educator only)
export const createQuiz = async (req, res) => {
  try {
    console.log('📝 Creating quiz with body:', req.body)
    const { courseId, chapterIndex, lectureIndex, title, description, questions, settings } = req.body
    const userId = req.auth.userId

    console.log('User ID:', userId)

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quiz = new Quiz({
      courseId,
      chapterIndex,
      lectureIndex,
      title,
      description,
      questions,
      settings,
      createdBy: userId
    })

    await quiz.save()
    console.log('✅ Quiz created successfully with ID:', quiz._id)

    res.json({ success: true, message: 'Quiz created successfully', quiz })
  } catch (error) {
    console.error('❌ Error creating quiz:', error)
    res.json({ success: false, message: error.message })
  }
}

// Get Quiz by ID (for taking quiz)
export const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const userId = req.auth.userId

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quiz = await Quiz.findById(quizId)
    
    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' })
    }

    // Check attempt count
    const attempts = await QuizAttempt.find({ quizId, userId }).sort({ attemptNumber: -1 })
    const attemptCount = attempts.length
    const latestAttempt = attempts[0] // Most recent attempt
    const hasPassed = latestAttempt?.passed === true

    console.log('🔍 Checking quiz attempts:', {
      userId,
      quizId,
      attemptCount,
      maxAttempts: quiz.settings.maxAttempts,
      hasPassed,
      latestAttemptNumber: latestAttempt?.attemptNumber,
      latestScore: latestAttempt?.percentage,
      canTakeQuiz: !hasPassed && attemptCount < quiz.settings.maxAttempts
    })

    // If user has already passed, they don't need to retake
    if (hasPassed) {
      console.log('✅ User already passed this quiz')
      return res.json({ 
        success: false, 
        message: `You have already passed this quiz with ${latestAttempt.percentage}%. No need to retake!`,
        hasPassed: true,
        latestAttempt
      })
    }

    // If user hasn't passed and reached max attempts
    if (attemptCount >= quiz.settings.maxAttempts) {
      console.log('❌ Maximum attempts reached without passing')
      return res.json({ 
        success: false, 
        message: `Maximum attempts reached. You have used all ${quiz.settings.maxAttempts} attempts without passing.`,
        maxAttempts: quiz.settings.maxAttempts,
        attemptCount,
        needHelp: true
      })
    }

    console.log('✅ User can take quiz, loading questions...')

    // Remove correct answers from questions (don't send to client)
    const quizData = quiz.toObject()
    quizData.questions = quizData.questions.map(q => {
      const question = { ...q }
      if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
        question.options = question.options.map(opt => ({
          _id: opt._id,
          text: opt.text
          // Don't send isCorrect
        }))
      }
      delete question.correctAnswer
      return question
    })

    // Shuffle questions if enabled
    if (quiz.settings.shuffleQuestions) {
      quizData.questions = shuffleArray(quizData.questions)
    }

    // Shuffle options if enabled
    if (quiz.settings.shuffleOptions) {
      quizData.questions = quizData.questions.map(q => {
        if (q.options && q.options.length > 0) {
          q.options = shuffleArray(q.options)
        }
        return q
      })
    }

    res.json({ 
      success: true, 
      quiz: quizData,
      attemptCount,
      attemptsRemaining: quiz.settings.maxAttempts - attemptCount
    })
  } catch (error) {
    console.error('Error getting quiz:', error)
    res.json({ success: false, message: error.message })
  }
}

// Submit Quiz Attempt
export const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers, startedAt } = req.body
    const userId = req.auth.userId

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quiz = await Quiz.findById(quizId)
    
    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' })
    }

    // Check attempt count
    const previousAttempts = await QuizAttempt.find({ quizId, userId }).sort({ attemptNumber: -1 })
    const attemptNumber = previousAttempts.length + 1
    const latestAttempt = previousAttempts[0]

    console.log('📊 Checking submission eligibility:', {
      userId,
      quizId,
      attemptNumber,
      maxAttempts: quiz.settings.maxAttempts,
      hasPreviousAttempts: previousAttempts.length > 0,
      latestPassed: latestAttempt?.passed
    })

    // If user already passed, don't allow resubmission
    if (latestAttempt?.passed) {
      console.log('⛔ User already passed, blocking resubmission')
      return res.json({ 
        success: false, 
        message: 'You have already passed this quiz. No need to retake!',
        hasPassed: true 
      })
    }

    // If user exceeded max attempts without passing
    if (attemptNumber > quiz.settings.maxAttempts) {
      console.log('⛔ Maximum attempts exceeded')
      return res.json({ 
        success: false, 
        message: 'Maximum attempts reached. Please contact your instructor for help.' 
      })
    }

    console.log('✅ Submission allowed, attempt number:', attemptNumber)

    // Grade the quiz
    console.log('🎓 Starting to grade quiz:', quizId)
    console.log('📝 Total questions:', quiz.questions.length)
    console.log('📋 User submitted answers:', answers.length)
    
    const gradedAnswers = []
    let totalPoints = 0
    let earnedPoints = 0

    quiz.questions.forEach((question, index) => {
      const userAnswer = answers.find(a => a.questionId === question._id.toString())
      totalPoints += question.points

      console.log(`\n--- Question ${index + 1} ---`)
      console.log('Question ID:', question._id.toString())
      console.log('Question Type:', question.questionType)
      console.log('Question Points:', question.points)
      console.log('User Answer:', userAnswer?.selectedAnswer)

      let isCorrect = false
      let pointsEarned = 0

      if (userAnswer) {
        if (question.questionType === 'multiple-choice') {
          const correctOption = question.options.find(opt => opt.isCorrect)
          console.log('Correct Option ID:', correctOption?._id.toString())
          console.log('Correct Option Text:', correctOption?.text)
          console.log('User Selected ID:', userAnswer.selectedAnswer)
          isCorrect = userAnswer.selectedAnswer === correctOption._id.toString()
          console.log('Is Correct?', isCorrect)
        } else if (question.questionType === 'true-false') {
          const correctOption = question.options.find(opt => opt.isCorrect)
          console.log('Correct Option Text:', correctOption?.text)
          console.log('User Selected Text:', userAnswer.selectedAnswer)
          isCorrect = userAnswer.selectedAnswer === correctOption.text
          console.log('Is Correct?', isCorrect)
        } else if (question.questionType === 'fill-blank') {
          console.log('Correct Answer:', question.correctAnswer)
          console.log('User Answer:', userAnswer.selectedAnswer)
          // Case-insensitive comparison, trim whitespace
          isCorrect = userAnswer.selectedAnswer.trim().toLowerCase() === 
                     question.correctAnswer.trim().toLowerCase()
          console.log('Is Correct?', isCorrect)
        }

        if (isCorrect) {
          pointsEarned = question.points
          earnedPoints += pointsEarned
          console.log('✅ Points earned:', pointsEarned)
        } else {
          console.log('❌ No points earned')
        }
      } else {
        console.log('⚠️ No answer submitted for this question')
      }

      gradedAnswers.push({
        questionId: question._id,
        selectedAnswer: userAnswer?.selectedAnswer || null,
        isCorrect,
        pointsEarned
      })
    })

    console.log('\n=== GRADING SUMMARY ===')
    console.log('Total Points Possible:', totalPoints)
    console.log('Points Earned:', earnedPoints)
    
    const percentage = (earnedPoints / totalPoints) * 100
    console.log('Percentage:', percentage.toFixed(2) + '%')
    console.log('Passing Score Required:', quiz.settings.passingScore + '%')
    
    const passed = percentage >= quiz.settings.passingScore
    console.log('Passed?', passed ? '✅ YES' : '❌ NO')
    console.log('=======================\n')

    const submittedAt = new Date()
    const timeSpent = Math.floor((submittedAt - new Date(startedAt)) / 1000) // seconds

    const attempt = new QuizAttempt({
      quizId,
      userId,
      answers: gradedAnswers,
      score: earnedPoints,
      totalPoints,
      percentage: Math.round(percentage * 100) / 100,
      passed,
      attemptNumber,
      startedAt: new Date(startedAt),
      submittedAt,
      timeSpent
    })

    await attempt.save()

    // Prepare response
    const response = {
      success: true,
      message: passed ? 'Congratulations! You passed!' : 'You did not pass. Try again!',
      attempt: {
        _id: attempt._id,
        score: earnedPoints,
        totalPoints,
        percentage: attempt.percentage,
        passed,
        attemptNumber,
        timeSpent
      }
    }

    // Include answers if settings allow
    if (quiz.settings.showAnswersAfterSubmit || 
        (quiz.settings.showAnswersAfterDeadline && quiz.settings.deadline && new Date() > quiz.settings.deadline)) {
      response.attempt.answers = gradedAnswers
      response.quiz = quiz // Include correct answers
    }

    // Update personalization analytics
    try {
      const personalizationResult = await PersonalizationService.updateAnalyticsAfterQuiz(
        userId,
        quiz.courseId,
        quizId,
        attempt._id,
        earnedPoints,
        totalPoints,
        timeSpent
      );
      
      if (personalizationResult.success) {
        response.recommendations = personalizationResult.recommendations;
      }
    } catch (error) {
      console.error('Error updating personalization:', error);
      // Don't fail the quiz submission if personalization fails
    }

    res.json(response)
  } catch (error) {
    console.error('Error submitting quiz:', error)
    res.json({ success: false, message: error.message })
  }
}

// Get Quiz Attempts (Student - own attempts)
export const getMyAttempts = async (req, res) => {
  try {
    const { quizId } = req.params
    const userId = req.auth.userId

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const attempts = await QuizAttempt.find({ quizId, userId })
      .sort({ createdAt: -1 })
      .select('-answers') // Don't include detailed answers

    res.json({ success: true, attempts })
  } catch (error) {
    console.error('Error getting attempts:', error)
    res.json({ success: false, message: error.message })
  }
}

// Get all attempts for a course (for checking quiz unlock status)
export const getCourseAttempts = async (req, res) => {
  try {
    const { courseId } = req.params
    const userId = req.auth.userId

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    // Get all quizzes for this course
    const quizzes = await Quiz.find({ courseId, isActive: true })
    const quizIds = quizzes.map(q => q._id)

    // Get all user's attempts for these quizzes
    const attempts = await QuizAttempt.find({ 
      quizId: { $in: quizIds }, 
      userId 
    }).select('quizId userId score totalPoints percentage passed attemptNumber submittedAt')

    console.log(`📊 Found ${attempts.length} attempts for course ${courseId}, user ${userId}`)

    res.json({ success: true, attempts })
  } catch (error) {
    console.error('Error getting course attempts:', error)
    res.json({ success: false, message: error.message })
  }
}

// Get Quiz Attempt Details
export const getAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params
    const userId = req.auth.userId

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const attempt = await QuizAttempt.findById(attemptId)

    if (!attempt) {
      return res.json({ success: false, message: 'Attempt not found' })
    }

    // Check if user owns this attempt
    if (attempt.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quiz = await Quiz.findById(attempt.quizId)

    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' })
    }

    // Check if answers should be shown
    const canShowAnswers = quiz.settings.showAnswersAfterSubmit || 
                          (quiz.settings.showAnswersAfterDeadline && 
                           quiz.settings.deadline && 
                           new Date() > quiz.settings.deadline)

    console.log('📋 Attempt Details:', {
      attemptId: attempt._id,
      quizId: attempt.quizId,
      attemptNumber: attempt.attemptNumber,
      passed: attempt.passed,
      canShowAnswers
    })

    if (!canShowAnswers) {
      return res.json({ 
        success: true, 
        attempt: {
          ...attempt.toObject(),
          answers: undefined
        },
        quiz: {
          _id: quiz._id,
          courseId: quiz.courseId,
          title: quiz.title,
          description: quiz.description,
          settings: quiz.settings
        },
        message: 'Answers will be available after deadline'
      })
    }

    res.json({ success: true, attempt: attempt.toObject(), quiz })
  } catch (error) {
    console.error('Error getting attempt details:', error)
    res.json({ success: false, message: error.message })
  }
}

// Get Quizzes for Students (enrolled students can view)
export const getStudentQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params
    const userId = req.auth.userId

    console.log('📚 Student requesting quizzes for course:', courseId)
    console.log('👤 User ID:', userId)

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    // Return all active quizzes for the course (no createdBy filter for students)
    const quizzes = await Quiz.find({ 
      courseId,
      isActive: true 
    }).sort({ chapterIndex: 1, lectureIndex: 1 })

    console.log('✅ Found quizzes for students:', quizzes.length)

    // Return quiz metadata (don't send actual questions to client yet)
    const sanitizedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      courseId: quiz.courseId,
      chapterIndex: quiz.chapterIndex,
      lectureIndex: quiz.lectureIndex,
      title: quiz.title,
      description: quiz.description,
      settings: {
        timeLimit: quiz.settings?.timeLimit || 30,
        maxAttempts: quiz.settings?.maxAttempts || 3,
        passingScore: quiz.settings?.passingScore || 70,
        shuffleQuestions: quiz.settings?.shuffleQuestions || false,
        shuffleOptions: quiz.settings?.shuffleOptions || false,
        showAnswersAfterSubmit: quiz.settings?.showAnswersAfterSubmit || true,
      },
      questionCount: quiz.questions?.length || 0,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt
    }))

    res.json({ success: true, quizzes: sanitizedQuizzes })
  } catch (error) {
    console.error('❌ Error getting student quizzes:', error)
    res.json({ success: false, message: error.message })
  }
}

// Get Quizzes by Course (Educator)
export const getCourseQuizzes = async (req, res) => {
  try {
    console.log('📚 Getting quizzes for course:', req.params.courseId)
    const { courseId } = req.params
    const userId = req.auth.userId

    console.log('User ID:', userId)

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quizzes = await Quiz.find({ courseId, createdBy: userId })
      .sort({ chapterIndex: 1, lectureIndex: 1 })

    console.log('✅ Found quizzes:', quizzes.length)
    console.log('Quiz IDs:', quizzes.map(q => q._id))

    res.json({ success: true, quizzes })
  } catch (error) {
    console.error('❌ Error getting course quizzes:', error)
    res.json({ success: false, message: error.message })
  }
}

// Update Quiz (Educator)
export const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const userId = req.auth.userId
    const updates = req.body

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: userId })

    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found or unauthorized' })
    }

    Object.assign(quiz, updates)
    await quiz.save()

    res.json({ success: true, message: 'Quiz updated successfully', quiz })
  } catch (error) {
    console.error('Error updating quiz:', error)
    res.json({ success: false, message: error.message })
  }
}

// Delete Quiz (Educator)
export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params
    const userId = req.auth.userId

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quiz = await Quiz.findOneAndDelete({ _id: quizId, createdBy: userId })

    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found or unauthorized' })
    }

    // Also delete all attempts
    await QuizAttempt.deleteMany({ quizId })

    res.json({ success: true, message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    res.json({ success: false, message: error.message })
  }
}

// Get Quiz Analytics (Educator)
export const getQuizAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params
    const userId = req.auth.userId

    if (!userId) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: userId })

    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found or unauthorized' })
    }

    const attempts = await QuizAttempt.find({ quizId })

    // Calculate analytics
    const totalAttempts = attempts.length
    const uniqueStudents = [...new Set(attempts.map(a => a.userId))].length
    const passedAttempts = attempts.filter(a => a.passed).length
    const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts * 100).toFixed(2) : 0
    const averageScore = totalAttempts > 0 
      ? (attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts).toFixed(2)
      : 0

    // Score distribution
    const scoreRanges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    }

    attempts.forEach(attempt => {
      const score = attempt.percentage
      if (score <= 20) scoreRanges['0-20']++
      else if (score <= 40) scoreRanges['21-40']++
      else if (score <= 60) scoreRanges['41-60']++
      else if (score <= 80) scoreRanges['61-80']++
      else scoreRanges['81-100']++
    })

    res.json({
      success: true,
      analytics: {
        totalAttempts,
        uniqueStudents,
        passedAttempts,
        passRate,
        averageScore,
        scoreDistribution: scoreRanges
      }
    })
  } catch (error) {
    console.error('Error getting quiz analytics:', error)
    res.json({ success: false, message: error.message })
  }
}

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
