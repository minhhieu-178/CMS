import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getCourseQuizzes } from '../../utils/api'
import toast from 'react-hot-toast'

const DebugQuizzes = () => {
  const { getToken } = useAuth()
  const [courseId, setCourseId] = useState('')
  const [quizzes, setQuizzes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFetch = async () => {
    if (!courseId.trim()) {
      toast.error('Please enter a course ID')
      return
    }

    setLoading(true)
    setError(null)
    setQuizzes(null)

    try {
      const token = await getToken()
      console.log('Fetching quizzes for courseId:', courseId)
      console.log('Token:', token ? 'Present' : 'Missing')

      const result = await getCourseQuizzes(token, courseId)
      console.log('API Result:', result)

      if (result.success) {
        setQuizzes(result.quizzes)
        toast.success(`Found ${result.quizzes.length} quizzes`)
      } else {
        setError(result.message || 'Failed to fetch quizzes')
        toast.error(result.message || 'Failed to fetch quizzes')
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
      toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Debug Quiz Fetching</h1>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course ID
              </label>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter course ID (e.g., 67678acbf9a14c4a2cf0b4cc)"
              />
            </div>

            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Fetch Quizzes'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">❌ Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {quizzes !== null && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-4">
                ✅ Found {quizzes.length} quiz(es)
              </p>

              {quizzes.length === 0 ? (
                <p className="text-gray-600">No quizzes found for this course</p>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz, index) => (
                    <div key={quiz._id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="font-bold text-lg mb-2">
                        {index + 1}. {quiz.title}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>ID:</strong> {quiz._id}</p>
                        <p><strong>Course ID:</strong> {quiz.courseId}</p>
                        <p><strong>Chapter:</strong> {quiz.chapterIndex + 1}</p>
                        <p><strong>Lecture:</strong> {quiz.lectureIndex !== null ? quiz.lectureIndex + 1 : 'N/A'}</p>
                        <p><strong>Questions:</strong> {quiz.questions?.length || 0}</p>
                        <p><strong>Created By:</strong> {quiz.createdBy}</p>
                        <p><strong>Active:</strong> {quiz.isActive ? 'Yes' : 'No'}</p>
                        <p><strong>Created At:</strong> {new Date(quiz.createdAt).toLocaleString()}</p>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Raw JSON:</p>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(quiz, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium mb-2">💡 Instructions:</p>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
              <li>Open your browser's Developer Console (F12)</li>
              <li>Enter the course ID you used when creating the quiz</li>
              <li>Click "Fetch Quizzes"</li>
              <li>Check the console logs for detailed information</li>
              <li>If no quizzes show up, check:
                <ul className="ml-6 mt-1 space-y-1 list-disc">
                  <li>Is the course ID correct?</li>
                  <li>Is the backend server running?</li>
                  <li>Are you logged in as the same user who created the quiz?</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugQuizzes
