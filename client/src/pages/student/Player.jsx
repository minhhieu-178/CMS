import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams, useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import Footer from '../../components/students/Footer'
import Rating from '../../components/students/Rating'
import { useUser, useAuth } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { getCourseQuizAttempts, updateLectureProgress } from '../../utils/api'

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url) => {
  if (!url) return null
  
  // Handle youtu.be format: https://youtu.be/VIDEO_ID
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split('?')[0].split('&')[0]
  }
  
  // Handle youtube.com format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1])
    return urlParams.get('v')
  }
  
  // If it's already just the ID
  if (!url.includes('http') && !url.includes('/')) {
    return url
  }
  
  return null
}

const Player = () => {
  const { enrolledCourses, calculateChapterTime } = useContext(AppContext)
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const { getToken } = useAuth()

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [playerData, setPlayerData] = useState(null)
  const [completedLectures, setCompletedLectures] = useState([])
  const [availableQuizzes, setAvailableQuizzes] = useState([])
  const [quizzesLoading, setQuizzesLoading] = useState(true)
  const [quizAttempts, setQuizAttempts] = useState([]) // Store attempts from MongoDB

  useEffect(() => {
    const course = enrolledCourses.find(c => c._id === courseId)
    if (course) setCourseData(course)
    
    // Load completed lectures from localStorage
    const storageKey = `completedLectures_${courseId}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setCompletedLectures(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading completed lectures:', error)
        setCompletedLectures([])
      }
    }
    
    // Load quizzes and attempts for this course
    loadQuizzes()
    loadQuizAttempts()
  }, [enrolledCourses, courseId])
  
  // Load quiz attempts from MongoDB
  const loadQuizAttempts = async () => {
    try {
      const token = await getToken()
      if (token) {
        const result = await getCourseQuizAttempts(token, courseId)
        if (result.success && result.attempts) {
          console.log('✅ Loaded quiz attempts from MongoDB:', result.attempts.length)
          setQuizAttempts(result.attempts)
        }
      }
    } catch (error) {
      console.error('❌ Error loading quiz attempts:', error)
    }
  }
  
  // Load quizzes when playerData changes
  useEffect(() => {
    if (playerData) {
      loadQuizzes()
    }
  }, [playerData])
  
  const loadQuizzes = async () => {
    console.log('🎯 Loading quizzes for courseId:', courseId)
    setQuizzesLoading(true)
    
    try {
      // Try loading from MongoDB API first (student endpoint)
      const token = await getToken?.()
      if (token) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/quiz/course/${courseId}/student`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const result = await response.json()
        
        if (result.success && result.quizzes) {
          console.log('✅ Loaded quizzes from MongoDB:', result.quizzes.length)
          setAvailableQuizzes(result.quizzes)
          setQuizzesLoading(false)
          return
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load quizzes from MongoDB, trying localStorage:', error)
    }
    
    // Fallback to localStorage
    const allQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]')
    const courseQuizzes = allQuizzes.filter(q => q.courseId === courseId)
    console.log('📦 Loaded quizzes from localStorage:', courseQuizzes.length)
    setAvailableQuizzes(courseQuizzes)
    setQuizzesLoading(false)
  }
  
  // Get quiz for current lecture
  const getCurrentLectureQuiz = () => {
    if (!playerData) return null
    
    const chapterIndex = playerData.chapter - 1
    const lectureIndex = playerData.lecture - 1
    
    return availableQuizzes.find(q => 
      q.chapterIndex === chapterIndex && 
      q.lectureIndex === lectureIndex
    )
  }
  
  // Check if user has completed quiz
  const hasCompletedQuiz = (quizId) => {
    if (!user) return false
    
    // Check from MongoDB attempts (state)
    const userAttempts = quizAttempts.filter(a => 
      a.quizId === quizId && 
      a.passed
    )
    
    return userAttempts.length > 0
  }

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Check if lecture is completed
  const isLectureCompleted = (chapterIndex, lectureIndex) => {
    return completedLectures.some(
      l => l.chapter === chapterIndex && l.lecture === lectureIndex
    )
  }

  // Check if lecture has a quiz that must be passed
  const getLectureQuiz = (chapterIndex, lectureIndex) => {
    return availableQuizzes.find(q => 
      q.chapterIndex === chapterIndex && 
      q.lectureIndex === lectureIndex
    )
  }
  
  // Check if user has passed the quiz for a lecture
  const hasPassedLectureQuiz = (chapterIndex, lectureIndex) => {
    const quiz = getLectureQuiz(chapterIndex, lectureIndex)
    if (!quiz) return true // No quiz = automatically passed
    
    if (!user) return false
    
    // Check from MongoDB attempts (state)
    const passedAttempts = quizAttempts.filter(a => 
      a.quizId === quiz._id && 
      a.passed
    )
    
    console.log(`🔍 Checking quiz unlock for lecture ${chapterIndex}-${lectureIndex}:`, {
      quizId: quiz._id,
      quizTitle: quiz.title,
      hasPassedAttempts: passedAttempts.length > 0,
      totalAttempts: quizAttempts.filter(a => a.quizId === quiz._id).length
    })
    
    return passedAttempts.length > 0
  }

  // Check if lecture is unlocked (can be watched)
  const isLectureUnlocked = (chapterIndex, lectureIndex) => {
    // First lecture is always unlocked
    if (chapterIndex === 0 && lectureIndex === 0) return true
    
    // Check if previous lecture in same chapter is completed AND quiz passed (if exists)
    if (lectureIndex > 0) {
      const prevLectureCompleted = isLectureCompleted(chapterIndex, lectureIndex - 1)
      const prevQuizPassed = hasPassedLectureQuiz(chapterIndex, lectureIndex - 1)
      return prevLectureCompleted && prevQuizPassed
    }
    
    // If first lecture of chapter, check if last lecture of previous chapter is completed AND quiz passed
    if (chapterIndex > 0 && courseData) {
      const prevChapter = courseData.courseContent[chapterIndex - 1]
      const lastLectureIndex = prevChapter.chapterContent.length - 1
      const prevLectureCompleted = isLectureCompleted(chapterIndex - 1, lastLectureIndex)
      const prevQuizPassed = hasPassedLectureQuiz(chapterIndex - 1, lastLectureIndex)
      return prevLectureCompleted && prevQuizPassed
    }
    
    return false
  }

  // Auto mark lecture as completed when video ends
  const handleVideoEnd = () => {
    console.log('🎥 Video ended, auto-marking as completed...');
    markLectureCompleted();
  };

  // Mark lecture as completed
  const markLectureCompleted = async () => {
    if (!playerData) return
    
    const lectureId = {
      chapter: playerData.chapter - 1,
      lecture: playerData.lecture - 1
    }
    
    // Check if already completed
    if (isLectureCompleted(lectureId.chapter, lectureId.lecture)) {
      toast.info('This lecture is already marked as completed!')
      return
    }
    
    // Check if there's a quiz for this lecture
    const quiz = getLectureQuiz(lectureId.chapter, lectureId.lecture)
    if (quiz && !hasPassedLectureQuiz(lectureId.chapter, lectureId.lecture)) {
      toast.warning(`⚠️ You must pass the quiz "${quiz.title}" (${quiz.settings?.passingScore || 70}%) to unlock the next lecture!`, {
        autoClose: 5000
      })
    }
    
    const updated = [...completedLectures, lectureId]
    setCompletedLectures(updated)
    
    // Save to localStorage
    const storageKey = `completedLectures_${courseId}`
    localStorage.setItem(storageKey, JSON.stringify(updated))
    
    // Update to MongoDB via API
    try {
      const token = await getToken()
      if (token && courseData) {
        const chapter = courseData.courseContent[lectureId.chapter]
        const lecture = chapter.chapterContent[lectureId.lecture]
        
        const chapterId = chapter.chapterId
        const actualLectureId = lecture.lectureId
        
        console.log('📤 Updating lecture progress to MongoDB:', {
          courseId,
          chapterId,
          lectureId: actualLectureId
        })
        
        const result = await updateLectureProgress(token, courseId, actualLectureId, chapterId)
        
        if (result.success) {
          console.log('✅ Progress updated to MongoDB:', result.progress)
          toast.success('Lecture marked as completed! Progress synced to cloud ✓')
        } else {
          console.error('❌ Failed to update progress to MongoDB:', result.message)
          toast.warning('Lecture saved locally. Will sync to cloud later.')
        }
      }
    } catch (error) {
      console.error('❌ Error updating progress to MongoDB:', error)
      toast.warning('Lecture saved locally. Will sync to cloud when online.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 sm:p-8 md:px-36 grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-8">

        {/* LEFT: COURSE STRUCTURE */}
        <div className="bg-white rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Course Structure
            </h2>
          </div>

          {courseData && courseData.courseContent.map((chapter, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 rounded-xl mb-3 bg-gradient-to-r from-gray-50 to-white overflow-hidden hover:shadow-md transition-all"
            >
              {/* Chapter header */}
              <div
                className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    openSections[index] 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'bg-gray-200'
                  }`}>
                    <img
                      src={assets.down_arrow_icon}
                      alt="arrow"
                      className={`w-4 transition-transform ${
                        openSections[index] ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                  <p className="font-bold text-gray-800 text-sm md:text-base">
                    {chapter.chapterTitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                    {chapter.chapterContent.length}
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    · {calculateChapterTime(chapter)}
                  </span>
                </div>
              </div>

              {/* Lectures */}
              {openSections[index] && (
                <ul className="border-t-2 border-gray-200 bg-white px-4 py-3 space-y-2">
                  {chapter.chapterContent.map((lecture, i) => {
                    const isUnlocked = isLectureUnlocked(index, i)
                    const isCompleted = isLectureCompleted(index, i)
                    const isCurrent = playerData?.lecture === i + 1 && playerData?.chapter === index + 1
                    
                    return (
                      <li
                        key={i}
                        className={`flex items-start justify-between gap-2 p-3 rounded-lg transition-all ${
                          isCurrent
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300'
                            : isCompleted
                            ? 'bg-green-50 border border-green-200'
                            : !isUnlocked
                            ? 'bg-gray-100 opacity-60'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isCurrent
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                              : isCompleted
                              ? 'bg-green-500'
                              : !isUnlocked
                              ? 'bg-gray-300'
                              : 'bg-gray-200'
                          }`}>
                            {isCompleted ? (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : !isUnlocked ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            ) : (
                              <img
                                src={assets.play_icon}
                                alt="play"
                                className="w-4 h-4"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !isUnlocked ? 'text-gray-400' : 'text-gray-700'
                            }`}>
                              {lecture.lectureTitle}
                            </p>
                            {!isUnlocked && (
                              <p className="text-xs text-gray-400 mt-1">
                                {(() => {
                                  // Check what's blocking this lecture
                                  if (i > 0) {
                                    const prevLectureCompleted = isLectureCompleted(index, i - 1)
                                    const prevQuiz = getLectureQuiz(index, i - 1)
                                    const prevQuizPassed = hasPassedLectureQuiz(index, i - 1)
                                    
                                    if (!prevLectureCompleted) {
                                      return '🔒 Complete previous lecture to unlock'
                                    } else if (prevQuiz && !prevQuizPassed) {
                                      return `🔒 Pass quiz "${prevQuiz.title}" (${prevQuiz.settings?.passingScore || 70}%) to unlock`
                                    }
                                  } else if (index > 0) {
                                    const prevChapter = courseData.courseContent[index - 1]
                                    const lastLectureIndex = prevChapter.chapterContent.length - 1
                                    const prevLectureCompleted = isLectureCompleted(index - 1, lastLectureIndex)
                                    const prevQuiz = getLectureQuiz(index - 1, lastLectureIndex)
                                    const prevQuizPassed = hasPassedLectureQuiz(index - 1, lastLectureIndex)
                                    
                                    if (!prevLectureCompleted) {
                                      return '🔒 Complete previous chapter to unlock'
                                    } else if (prevQuiz && !prevQuizPassed) {
                                      return `🔒 Pass quiz "${prevQuiz.title}" (${prevQuiz.settings?.passingScore || 70}%) to unlock`
                                    }
                                  }
                                  return '🔒 Complete previous lecture to unlock'
                                })()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {lecture.lectureUrl && isUnlocked && (
                            <button
                              onClick={() =>
                                setPlayerData({
                                  ...lecture,
                                  chapter: index + 1,
                                  lecture: i + 1,
                                })
                              }
                              className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                            >
                              Watch
                            </button>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            !isUnlocked ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {humanizeDuration(lecture.lectureDuration * 60 * 1000, {
                              units: ['h', 'm'],
                            })}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}

          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Rate this Course
            </h3>
            <Rating initialRating={0} courseId={courseId}/>
          </div>
        </div>

        {/* RIGHT: VIDEO PLAYER */}
        <div className="sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">

            {playerData ? (
              <>
                <div className="w-full aspect-video overflow-hidden bg-black">
                  <YouTube
                    videoId={getYouTubeVideoId(playerData.lectureUrl)}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                    opts={{
                      width: '100%',
                      height: '100%',
                      playerVars: {
                        autoplay: 1,
                      },
                    }}
                    onEnd={handleVideoEnd}
                  />
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          Lecture {playerData.chapter}.{playerData.lecture}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {playerData.lectureTitle}
                      </h3>
                    </div>

                    <button 
                      onClick={markLectureCompleted}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">
                        {humanizeDuration(playerData.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quiz Section */}
                  {quizzesLoading ? (
                    <div className="mt-6 p-4 bg-gray-100 rounded-xl border border-gray-300">
                      <p className="text-gray-600 text-sm">Loading quiz...</p>
                    </div>
                  ) : (() => {
                    const quiz = getCurrentLectureQuiz()
                    console.log('🎯 Current lecture quiz:', quiz)
                    console.log('📚 Available quizzes:', availableQuizzes)
                    console.log('📍 Current lecture:', playerData.chapter - 1, playerData.lecture - 1)
                    
                    if (quiz) {
                      const isCompleted = hasCompletedQuiz(quiz._id)
                      // Use state instead of localStorage
                      const userAttempts = quizAttempts.filter(a => a.quizId === quiz._id)
                      const canRetake = userAttempts.length < (quiz.settings?.maxAttempts || 3)
                      const bestScore = userAttempts.length > 0 
                        ? Math.max(...userAttempts.map(a => parseFloat(a.percentage)))
                        : 0
                      
                      console.log('📊 Quiz status:', {
                        quizId: quiz._id,
                        isCompleted,
                        userAttempts: userAttempts.length,
                        canRetake,
                        bestScore
                      })
                      
                      return (
                        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                {quiz.title}
                                {isCompleted && (
                                  <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Passed
                                  </span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  📝 {quiz.questionCount || quiz.questions?.length || 0} questions
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  ⏱️ {quiz.settings?.timeLimit || 30} min
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-bold text-orange-600">
                                  🎯 {quiz.settings?.passingScore || 70}% required to pass
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  🔄 {userAttempts.length}/{quiz.settings?.maxAttempts || 3} attempts
                                </span>
                              </div>
                              
                              {userAttempts.length > 0 && (
                                <div className="mb-3 p-2 bg-white rounded-lg border border-purple-200">
                                  <p className="text-xs text-gray-600">
                                    Best Score: <span className={`font-bold ${bestScore >= (quiz.settings?.passingScore || 70) ? 'text-green-600' : 'text-orange-600'}`}>
                                      {bestScore.toFixed(1)}%
                                    </span>
                                    {bestScore < (quiz.settings?.passingScore || 70) && (
                                      <span className="text-red-600 ml-2">
                                        (Need {quiz.settings?.passingScore || 70}% to unlock next lecture)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}
                              
                              {!isCompleted && userAttempts.length > 0 && (
                                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                  <p className="text-xs text-yellow-800 font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    You must score at least {quiz.settings?.passingScore || 70}% to unlock the next lecture!
                                  </p>
                                </div>
                              )}
                              
                              {isCompleted ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const lastAttempt = userAttempts.filter(a => a.passed).sort((a, b) => 
                                        new Date(b.submittedAt) - new Date(a.submittedAt)
                                      )[0]
                                      if (lastAttempt) {
                                        navigate(`/quiz-result/${lastAttempt._id}`)
                                      }
                                    }}
                                    className="px-4 py-2 bg-white text-purple-700 border-2 border-purple-300 rounded-lg hover:bg-purple-50 text-sm font-medium transition-all"
                                  >
                                    View Results
                                  </button>
                                  {canRetake && (
                                    <button
                                      onClick={() => navigate(`/take-quiz/${quiz._id}`)}
                                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-all"
                                    >
                                      Retake Quiz
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => navigate(`/take-quiz/${quiz._id}`)}
                                  disabled={!canRetake}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {canRetake ? 'Take Quiz' : 'Max Attempts Reached'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </>
            ) : (
              <div className="relative group">
                <img
                  src={courseData?.courseThumbnail}
                  alt="Course thumbnail"
                  className="w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold">Select a lecture to start learning</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  )
}

export default Player
