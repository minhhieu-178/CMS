import React, { useState, useContext, useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { getQuizById, updateQuiz } from '../../utils/api'
import toast from 'react-hot-toast'
import ImprovedLoading from '../../components/students/ImprovedLoading'

const EditQuiz = () => {
  const { navigate } = useContext(AppContext)
  const { quizId } = useParams()
  const navigateRouter = useNavigate()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    chapterIndex: 0,
    lectureIndex: 0,
    questions: [],
    settings: {
      timeLimit: 30,
      maxAttempts: 3,
      passingScore: 70,
      shuffleQuestions: true,
      shuffleOptions: true,
      showAnswersAfterSubmit: true,
      showAnswersAfterDeadline: false,
      deadline: ''
    }
  })

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const result = await getQuizById(token, quizId)

      if (result.success) {
        const quiz = result.quiz
        setQuizData({
          title: quiz.title || '',
          description: quiz.description || '',
          chapterIndex: quiz.chapterIndex || 0,
          lectureIndex: quiz.lectureIndex !== undefined ? quiz.lectureIndex : 0,
          questions: quiz.questions.map(q => ({
            ...q,
            id: q._id || Date.now() + Math.random()
          })),
          settings: {
            timeLimit: quiz.settings?.timeLimit || 30,
            maxAttempts: quiz.settings?.maxAttempts || 3,
            passingScore: quiz.settings?.passingScore || 70,
            shuffleQuestions: quiz.settings?.shuffleQuestions !== undefined ? quiz.settings.shuffleQuestions : true,
            shuffleOptions: quiz.settings?.shuffleOptions !== undefined ? quiz.settings.shuffleOptions : true,
            showAnswersAfterSubmit: quiz.settings?.showAnswersAfterSubmit !== undefined ? quiz.settings.showAnswersAfterSubmit : true,
            showAnswersAfterDeadline: quiz.settings?.showAnswersAfterDeadline || false,
            deadline: quiz.settings?.deadline || ''
          }
        })
      } else {
        toast.error(result.message || 'Failed to load quiz')
        navigateRouter(-1)
      }
    } catch (error) {
      console.error('Error fetching quiz:', error)
      toast.error('Failed to load quiz')
      navigateRouter(-1)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      questionText: '',
      questionType: type,
      options: type === 'true-false' 
        ? [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: false }]
        : type === 'multiple-choice'
        ? [{ text: '', isCorrect: false }]
        : [],
      correctAnswer: '',
      points: 1,
      order: quizData.questions.length
    }
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const updateQuestion = (questionId, field, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }))
  }

  const addOption = (questionId) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId
          ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
          : q
      )
    }))
  }

  const updateOption = (questionId, optionIndex, field, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex
                  ? { ...opt, [field]: value }
                  : field === 'isCorrect' && value
                  ? { ...opt, isCorrect: false }
                  : opt
              )
            }
          : q
      )
    }))
  }

  const deleteOption = (questionId, optionIndex) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, idx) => idx !== optionIndex) }
          : q
      )
    }))
  }

  const deleteQuestion = (questionId) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!quizData.title.trim()) {
      toast.error('Please enter quiz title')
      return
    }

    if (quizData.questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    // Validate questions
    for (const q of quizData.questions) {
      if (!q.questionText.trim()) {
        toast.error('All questions must have text')
        return
      }

      if (q.questionType === 'multiple-choice' || q.questionType === 'true-false') {
        if (q.options.length < 2) {
          toast.error('Multiple choice questions must have at least 2 options')
          return
        }
        if (!q.options.some(opt => opt.isCorrect)) {
          toast.error('Each question must have at least one correct answer')
          return
        }
      }

      if (q.questionType === 'fill-blank' && !q.correctAnswer.trim()) {
        toast.error('Fill in the blank questions must have a correct answer')
        return
      }
    }

    try {
      const token = await getToken()
      
      // Prepare quiz data for MongoDB
      const quizPayload = {
        chapterIndex: quizData.chapterIndex,
        lectureIndex: quizData.lectureIndex,
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          order: q.order
        })),
        settings: quizData.settings
      }

      const result = await updateQuiz(token, quizId, quizPayload)

      if (result.success) {
        toast.success('Quiz updated successfully!')
        navigateRouter(-1)
      } else {
        toast.error(result.message || 'Failed to update quiz')
      }
    } catch (error) {
      console.error('Error updating quiz:', error)
      toast.error('Failed to update quiz. Please try again.')
    }
  }

  if (loading) {
    return <ImprovedLoading />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Quiz</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={quizData.title}
                  onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chapter 1 Quiz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={quizData.description}
                  onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Brief description of the quiz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter Number * (1 = First Chapter)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quizData.chapterIndex + 1}
                    onChange={(e) => setQuizData(prev => ({ ...prev, chapterIndex: parseInt(e.target.value) - 1 }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1 for first chapter"
                  />
                  <p className="text-xs text-gray-500 mt-1">Currently: Chapter {quizData.chapterIndex + 1}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lecture Number (Optional, 1 = First Lecture)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quizData.lectureIndex !== null ? quizData.lectureIndex + 1 : ''}
                    onChange={(e) => setQuizData(prev => ({ ...prev, lectureIndex: e.target.value ? parseInt(e.target.value) - 1 : null }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty for chapter quiz"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {quizData.lectureIndex !== null 
                      ? `Currently: Lecture ${quizData.lectureIndex + 1}` 
                      : 'Chapter-level quiz'}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quiz Settings</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quizData.settings.timeLimit}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, timeLimit: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quizData.settings.maxAttempts}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, maxAttempts: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quizData.settings.passingScore}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, passingScore: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={quizData.settings.shuffleQuestions}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, shuffleQuestions: e.target.checked }
                    }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Shuffle Questions</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={quizData.settings.shuffleOptions}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, shuffleOptions: e.target.checked }
                    }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Shuffle Options</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={quizData.settings.showAnswersAfterSubmit}
                    onChange={(e) => setQuizData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, showAnswersAfterSubmit: e.target.checked }
                    }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Show Answers After Submit</span>
                </label>
              </div>
            </div>

            {/* Questions */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addQuestion('multiple-choice')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    + Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('true-false')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    + True/False
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion('fill-blank')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    + Fill Blank
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {quizData.questions.map((question, qIndex) => (
                  <div key={question.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-700">Question {qIndex + 1}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {question.questionType}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={question.questionText}
                        onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows="2"
                        placeholder="Enter question text..."
                      />

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-700">
                          Points:
                          <input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                            className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        </label>
                      </div>

                      {/* Options for multiple-choice and true-false */}
                      {(question.questionType === 'multiple-choice' || question.questionType === 'true-false') && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Options:</label>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={option.isCorrect}
                                onChange={(e) => updateOption(question.id, optIndex, 'isCorrect', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <input
                                type="text"
                                value={option.text}
                                onChange={(e) => updateOption(question.id, optIndex, 'text', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder={`Option ${optIndex + 1}`}
                                disabled={question.questionType === 'true-false'}
                              />
                              {question.questionType === 'multiple-choice' && question.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => deleteOption(question.id, optIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          {question.questionType === 'multiple-choice' && (
                            <button
                              type="button"
                              onClick={() => addOption(question.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              + Add Option
                            </button>
                          )}
                        </div>
                      )}

                      {/* Correct answer for fill-blank */}
                      {question.questionType === 'fill-blank' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correct Answer:
                          </label>
                          <input
                            type="text"
                            value={question.correctAnswer}
                            onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter correct answer..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
              >
                Update Quiz
              </button>
              <button
                type="button"
                onClick={() => navigateRouter(-1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditQuiz
