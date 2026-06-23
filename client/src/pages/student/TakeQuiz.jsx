import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { getQuiz, submitQuizAttempt } from '../../utils/api'
import toast from 'react-hot-toast'

const TakeQuiz = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { getToken } = useAuth()
  
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState([])
  const [startedAt, setStartedAt] = useState(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState(0)

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && quiz && startedAt) {
      handleSubmit()
    }
  }, [timeLeft])

  const loadQuiz = async () => {
    try {
      const token = await getToken()
      const result = await getQuiz(token, quizId)
      
      if (!result.success) {
        // Handle specific cases
        if (result.hasPassed) {
          toast.success(result.message || 'You have already passed this quiz!')
          // Redirect to latest attempt if available
          if (result.latestAttempt?._id) {
            navigate(`/quiz-result/${result.latestAttempt._id}`)
          } else {
            navigate(-1)
          }
          return
        } else if (result.needHelp) {
          toast.error(result.message || 'Maximum attempts reached')
          navigate(-1)
          return
        } else {
          toast.error(result.message || 'Failed to load quiz')
          navigate(-1)
          return
        }
      }

      setQuiz(result.quiz)
      setQuestions(result.quiz.questions)
      setAttemptCount(result.attemptCount)
      setAttemptsRemaining(result.attemptsRemaining)
      setTimeLeft(result.quiz.settings.timeLimit * 60) // Convert to seconds
      setStartedAt(new Date().toISOString())
    } catch (error) {
      console.error('Error loading quiz:', error)
      toast.error('Failed to load quiz')
      navigate(-1)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    if (!window.confirm('Are you sure you want to submit your quiz?')) {
      return
    }
    
    setIsSubmitting(true)

    try {
      const token = await getToken()
      
      // Prepare answers in the format expected by backend
      const formattedAnswers = questions.map(question => ({
        questionId: question._id,
        selectedAnswer: answers[question._id] || null
      }))

      console.log('📤 Submitting quiz answers:')
      formattedAnswers.forEach((answer, idx) => {
        const question = questions[idx]
        console.log(`Question ${idx + 1}:`, {
          questionId: answer.questionId,
          questionText: question.questionText,
          questionType: question.questionType,
          selectedAnswer: answer.selectedAnswer,
          selectedAnswerType: typeof answer.selectedAnswer
        })
      })

      const result = await submitQuizAttempt(token, quizId, formattedAnswers, startedAt)

      if (result.success) {
        // Save attempt to localStorage for unlock logic
        const allAttempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]')
        const newAttempt = {
          _id: result.attempt._id,
          quizId: quizId,
          userId: user.id,
          score: result.attempt.score,
          totalPoints: result.attempt.totalPoints,
          percentage: result.attempt.percentage,
          passed: result.attempt.passed,
          attemptNumber: result.attempt.attemptNumber,
          timeSpent: result.attempt.timeSpent,
          submittedAt: new Date().toISOString()
        }
        
        allAttempts.push(newAttempt)
        localStorage.setItem('quizAttempts', JSON.stringify(allAttempts))
        
        console.log('💾 Saved attempt to localStorage:', newAttempt)
        
        toast.success(result.message)
        // Navigate to result page
        navigate(`/quiz-result/${result.attempt._id}`)
      } else {
        toast.error(result.message || 'Failed to submit quiz')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error('Failed to submit quiz. Please try again.')
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-gray-600 text-sm mt-1">{quiz.description}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${
              timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-bold">{currentQuestion + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900 mb-2">{question.questionText}</p>
              <span className="text-sm text-gray-500">{question.points} point{question.points > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {question.questionType === 'multiple-choice' || question.questionType === 'true-false' ? (
              question.options.map((option, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[question._id] === option._id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    value={option._id}
                    checked={answers[question._id] === option._id}
                    onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-900">{option.text}</span>
                </label>
              ))
            ) : question.questionType === 'fill-blank' ? (
              <input
                type="text"
                value={answers[question._id] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                placeholder="Type your answer here..."
              />
            ) : null}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600">
            {Object.keys(answers).length} of {questions.length} answered
          </div>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>

        {/* Warning */}
        {timeLeft < 300 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">
              Less than 5 minutes remaining! Your quiz will be automatically submitted when time runs out.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TakeQuiz
