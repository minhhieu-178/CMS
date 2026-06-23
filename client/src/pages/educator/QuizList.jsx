import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, BarChart3, Clock, Users, Award } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { getCourseQuizzes, deleteQuiz, getQuizAnalytics, getCourseDetails } from '../../utils/api'
import toast from 'react-hot-toast'

const QuizList = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  
  const [quizzes, setQuizzes] = useState([])
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quizStats, setQuizStats] = useState({})

  useEffect(() => {
    loadData()
  }, [courseId])

  const loadData = async () => {
    try {
      const token = await getToken()
      
      // Load course details
      const courseResult = await getCourseDetails(courseId)
      if (courseResult.success) {
        setCourse(courseResult.course)
      }
      
      // Load quizzes
      console.log('Loading quizzes for courseId:', courseId)
      const quizzesResult = await getCourseQuizzes(token, courseId)
      console.log('Quizzes result:', quizzesResult)
      if (quizzesResult.success) {
        console.log('Found quizzes:', quizzesResult.quizzes.length)
        console.log('Quiz data:', quizzesResult.quizzes)
        setQuizzes(quizzesResult.quizzes)
        
        // Load stats for each quiz
        console.log('Loading analytics for each quiz...')
        const statsPromises = quizzesResult.quizzes.map(async (quiz) => {
          try {
            const statsResult = await getQuizAnalytics(token, quiz._id)
            console.log(`Analytics for quiz ${quiz._id}:`, statsResult)
            return { quizId: quiz._id, stats: statsResult.analytics }
          } catch (error) {
            console.error(`Error loading analytics for quiz ${quiz._id}:`, error)
            return { quizId: quiz._id, stats: null }
          }
        })
        
        const allStats = await Promise.all(statsPromises)
        console.log('All stats loaded:', allStats)
        const statsMap = {}
        allStats.forEach(({ quizId, stats }) => {
          statsMap[quizId] = stats
        })
        console.log('Stats map:', statsMap)
        setQuizStats(statsMap)
        console.log('✅ Quizzes and stats loaded successfully!')
      } else {
        toast.error(quizzesResult.message || 'Failed to load quizzes')
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load quiz data')
      setLoading(false)
    }
  }

  const handleDelete = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all student attempts.')) return

    try {
      const token = await getToken()
      const result = await deleteQuiz(token, quizId)
      
      if (result.success) {
        toast.success('Quiz deleted successfully!')
        loadData() // Reload data
      } else {
        toast.error(result.message || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Error deleting quiz:', error)
      toast.error('Failed to delete quiz')
    }
  }

  const getQuizStatsDisplay = (quizId) => {
    return quizStats[quizId] || {
      totalAttempts: 0,
      uniqueStudents: 0,
      passedAttempts: 0,
      averageScore: 0
    }
  }

  if (loading) {
    console.log('⏳ QuizList: Loading state')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  console.log('🎯 QuizList: Rendering with quizzes:', quizzes)
  console.log('📊 QuizList: Quiz count:', quizzes.length)
  console.log('📈 QuizList: Quiz stats:', quizStats)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Management</h1>
              {course && (
                <p className="text-gray-600">
                  Course: <span className="font-semibold">{course.courseTitle}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => navigate(`/educator/create-quiz/${courseId}`)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create New Quiz
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{quizzes.length}</p>
                  <p className="text-sm text-gray-600">Total Quizzes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {quizzes.reduce((sum, q) => sum + getQuizStatsDisplay(q._id).uniqueStudents, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {quizzes.reduce((sum, q) => sum + getQuizStatsDisplay(q._id).totalAttempts, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Attempts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {quizzes.filter(q => q.isActive).length}
                  </p>
                  <p className="text-sm text-gray-600">Active Quizzes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz List */}
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Yet</h3>
            <p className="text-gray-600 mb-6">Create your first quiz to assess student learning</p>
            <button
              onClick={() => navigate(`/educator/create-quiz/${courseId}`)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
            >
              Create First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Debug: Confirm we're in the right branch */}
            <div className="bg-green-100 border-2 border-green-500 p-4 rounded-lg mb-4">
              <p className="text-green-800 font-bold">
                ✅ Rendering {quizzes.length} quiz(es)
              </p>
            </div>
            
            {quizzes.map((quiz) => {
              const stats = getQuizStatsDisplay(quiz._id)
              console.log('Rendering quiz card for:', quiz._id, quiz.title)
              return (
                <div key={quiz._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          quiz.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {quiz.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {quiz.description && (
                        <p className="text-gray-600 mb-3">{quiz.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          Chapter {quiz.chapterIndex + 1}
                          {quiz.lectureIndex !== null && ` - Lecture ${quiz.lectureIndex + 1}`}
                        </span>
                        <span className="flex items-center gap-1">
                          📝 {quiz.questions.length} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {quiz.settings.timeLimit} min
                        </span>
                        <span className="flex items-center gap-1">
                          🎯 {quiz.settings.passingScore}% to pass
                        </span>
                        <span className="flex items-center gap-1">
                          🔄 {quiz.settings.maxAttempts} attempts
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/educator/quiz/${quiz._id}/analytics`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/educator/edit-quiz/${quiz._id}`)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Quiz"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</p>
                      <p className="text-xs text-gray-600">Total Attempts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.uniqueStudents}</p>
                      <p className="text-xs text-gray-600">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.passedAttempts}</p>
                      <p className="text-xs text-gray-600">Passed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.averageScore}%</p>
                      <p className="text-xs text-gray-600">Avg Score</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/educator/my-courses')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            ← Back to My Courses
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizList
