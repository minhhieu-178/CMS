import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Award, Clock, TrendingUp, RotateCcw } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { getQuizAttemptDetails } from '../../utils/api'
import toast from 'react-hot-toast'

const QuizResult = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  
  const [attempt, setAttempt] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAttempt()
  }, [attemptId])

  const loadAttempt = async () => {
    try {
      const token = await getToken()
      const result = await getQuizAttemptDetails(token, attemptId)
      
      if (!result.success) {
        toast.error(result.message || 'Failed to load quiz results')
        navigate(-1)
        return
      }

      // Extract quizId properly (might be populated as object or string)
      const quizIdValue = typeof result.attempt.quizId === 'object' 
        ? result.attempt.quizId._id 
        : result.attempt.quizId

      console.log('📝 Setting attempt data:', {
        attemptId: result.attempt._id,
        quizId: quizIdValue,
        attemptNumber: result.attempt.attemptNumber,
        passed: result.attempt.passed
      })

      setAttempt({
        ...result.attempt,
        quizId: quizIdValue // Ensure it's always a string ID
      })
      setQuiz(result.quiz)
      
      // Check if answers should be shown
      if (result.quiz && result.attempt.answers) {
        setShowAnswers(true)
      } else if (result.message) {
        toast.info(result.message)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading attempt:', error)
      toast.error('Failed to load quiz results')
      navigate(-1)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const canRetake = () => {
    if (!quiz || !attempt) {
      console.log('⚠️ Cannot check retake: missing quiz or attempt data')
      return false
    }
    
    // If already passed, no need to retake
    if (attempt.passed) {
      console.log('✅ Already passed, no retake needed')
      return false
    }
    
    // Check if there are attempts remaining
    const canRetakeResult = attempt.attemptNumber < quiz.settings.maxAttempts
    
    console.log('🔄 Can Retake Check:', {
      attemptNumber: attempt.attemptNumber,
      maxAttempts: quiz.settings.maxAttempts,
      passed: attempt.passed,
      canRetake: canRetakeResult,
      attemptsRemaining: quiz.settings.maxAttempts - attempt.attemptNumber
    })
    
    return canRetakeResult
  }

  if (loading || !attempt || !quiz) {
    console.log('⏳ Loading state:', { loading, hasAttempt: !!attempt, hasQuiz: !!quiz })
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  console.log('📊 Quiz Result Data:', {
    quizId: quiz._id,
    attemptId: attempt._id,
    attemptNumber: attempt.attemptNumber,
    maxAttempts: quiz.settings?.maxAttempts,
    passed: attempt.passed,
    percentage: attempt.percentage,
    passingScore: quiz.settings?.passingScore
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Result Header */}
        <div className={`rounded-xl shadow-lg p-8 mb-6 ${
          attempt.passed 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-red-500 to-pink-600'
        }`}>
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {attempt.passed ? (
                <CheckCircle className="w-12 h-12" />
              ) : (
                <XCircle className="w-12 h-12" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {attempt.passed ? 'Congratulations! 🎉' : 'Keep Trying! 💪'}
            </h1>
            <p className="text-xl mb-4">
              {attempt.passed 
                ? `You passed with ${attempt.percentage}% - Next lecture unlocked! 🎓` 
                : `You scored ${attempt.percentage}% (Need ${quiz.settings.passingScore}% to unlock next lecture)`
              }
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="opacity-90">Score</p>
                <p className="text-2xl font-bold">{attempt.score}/{attempt.totalPoints}</p>
              </div>
              <div>
                <p className="opacity-90">Time Spent</p>
                <p className="text-2xl font-bold">{formatTime(attempt.timeSpent)}</p>
              </div>
              <div>
                <p className="opacity-90">Correct</p>
                <p className="text-2xl font-bold">
                  {attempt.answers.filter(a => a.isCorrect).length}/{attempt.answers.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{attempt.percentage}%</p>
                <p className="text-sm text-gray-600">Score</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {attempt.answers.filter(a => a.isCorrect).length}
                </p>
                <p className="text-sm text-gray-600">Correct</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {attempt.answers.filter(a => !a.isCorrect).length}
                </p>
                <p className="text-sm text-gray-600">Incorrect</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(attempt.timeSpent)}</p>
                <p className="text-sm text-gray-600">Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Review */}
        {showAnswers && attempt.answers && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Answer Review</h2>
            <div className="space-y-6">
              {attempt.answers.map((answer, idx) => {
                // Find the question from quiz
                const question = quiz.questions.find(q => q._id.toString() === answer.questionId.toString())
                
                return (
                  <div 
                    key={idx}
                    className={`border-2 rounded-lg p-6 ${
                      answer.isCorrect 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {answer.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">
                          Question {idx + 1}: {question?.questionText || 'Question'}
                        </p>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-700">
                            <span className="font-medium">Your Answer:</span>{' '}
                            <span className={answer.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {(() => {
                                if (!answer.selectedAnswer) return '(No answer)';
                                
                                // For multiple-choice, find option text by ID
                                if (question?.questionType === 'multiple-choice' || question?.questionType === 'true-false') {
                                  const selectedOption = question.options?.find(
                                    opt => opt._id?.toString() === answer.selectedAnswer?.toString()
                                  );
                                  return selectedOption?.text || answer.selectedAnswer;
                                }
                                
                                // For fill-blank, use the text directly
                                return answer.selectedAnswer;
                              })()}
                            </span>
                          </p>
                          {!answer.isCorrect && question && (
                            <p className="text-gray-700">
                              <span className="font-medium">Correct Answer:</span>{' '}
                              <span className="text-green-700">
                                {question.questionType === 'fill-blank' 
                                  ? question.correctAnswer 
                                  : question.options?.find(opt => opt.isCorrect)?.text || 'N/A'}
                              </span>
                            </p>
                          )}
                          <p className="text-gray-600">
                            Points: {answer.pointsEarned}/{question?.points || 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {(() => {
            const canRetakeValue = canRetake()
            const showRetakeButton = canRetakeValue && !attempt.passed
            console.log('🎯 Retake Button Display:', {
              canRetake: canRetakeValue,
              passed: attempt.passed,
              showButton: showRetakeButton,
              quizId: attempt.quizId,
              navigatePath: `/take-quiz/${attempt.quizId}`
            })
            
            if (showRetakeButton) {
              return (
                <button
                  onClick={() => {
                    console.log('🔄 Retake button clicked, navigating to:', `/take-quiz/${attempt.quizId}`)
                    navigate(`/take-quiz/${attempt.quizId}`)
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retake Quiz (Attempt {attempt.attemptNumber + 1}/{quiz.settings.maxAttempts})
                </button>
              )
            }
            return null
          })()}
          
          <button
            onClick={() => navigate(`/player/${quiz.courseId}`)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Back to Course
          </button>
        </div>

        {/* Retake Info */}
        {!canRetake() && !attempt.passed && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 font-medium">
              ⚠️ You have used all {quiz.settings.maxAttempts} attempts for this quiz.
            </p>
            <p className="text-yellow-700 text-sm mt-2">
              You need {quiz.settings.passingScore}% to unlock the next lecture. Please contact your instructor for help.
            </p>
          </div>
        )}
        
        {/* Pass requirement reminder */}
        {!attempt.passed && canRetake() && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 font-medium">
              💡 Remember: You need to score at least {quiz.settings.passingScore}% to unlock the next lecture.
            </p>
            <p className="text-blue-700 text-sm mt-2">
              You have {quiz.settings.maxAttempts - attempt.attemptNumber} attempt(s) remaining.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizResult
