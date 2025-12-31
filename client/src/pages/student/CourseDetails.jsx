import { useContext, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { useAuth } from '@clerk/clerk-react'
import { createPaymentOrder } from '../../utils/api'
import { toast } from 'react-toastify'
import Loading from '../../components/students/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/students/Footer'
import YouTube from 'react-youtube'

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

const CourseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken, userId } = useAuth()
  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
  const [playerData, setPlayerData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const {
    allCourses,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    currency
  } = useContext(AppContext)

  const fetchCourseData = useCallback(() => {
    if (allCourses?.length) {
      const findCourse = allCourses.find(course => course._id === id)
      setCourseData(findCourse)
      
      // Check if already enrolled
      const enrollments = JSON.parse(localStorage.getItem('myEnrollments') || '[]')
      const isEnrolled = enrollments.some(e => e.courseId === id)
      setIsAlreadyEnrolled(isEnrolled)
    }
  }, [allCourses, id])

  useEffect(() => {
    fetchCourseData()
  }, [fetchCourseData])

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleEnroll = async () => {
    try {
      setIsProcessing(true)
      const token = await getToken()
      
      if (!token) {
        toast.error('Please sign in to enroll')
        setIsProcessing(false)
        return
      }

      // Check if user is the course creator
      if (courseData.educator === userId || courseData.educator?._id === userId) {
        toast.info('You are the creator of this course - Free enrollment!')
        setIsAlreadyEnrolled(true)
        setIsProcessing(false)
        
        // Save enrollment to localStorage
        const enrollments = JSON.parse(localStorage.getItem('myEnrollments') || '[]')
        if (!enrollments.find(e => e.courseId === id)) {
          enrollments.push({
            courseId: id,
            enrollmentDate: new Date().toISOString(),
            status: 'active'
          })
          localStorage.setItem('myEnrollments', JSON.stringify(enrollments))
        }
        
        setTimeout(() => {
          navigate('/my-enrollments')
        }, 1500)
        return
      }

      // Check if course exists in localStorage (demo mode)
      if (!courseData.courseThumbnail || courseData.courseThumbnail.includes('youtube') || courseData.courseThumbnail.includes('unsplash')) {
        // This is a localStorage course, use demo enrollment
        toast.success('Demo enrollment successful! (No payment required)')
        setIsAlreadyEnrolled(true)
        setIsProcessing(false)
        
        // Save enrollment to localStorage
        const enrollments = JSON.parse(localStorage.getItem('myEnrollments') || '[]')
        if (!enrollments.find(e => e.courseId === id)) {
          enrollments.push({
            courseId: id,
            enrollmentDate: new Date().toISOString(),
            status: 'active'
          })
          localStorage.setItem('myEnrollments', JSON.stringify(enrollments))
        }
        
        setTimeout(() => {
          navigate('/my-enrollments')
        }, 1500)
        return
      }

      // Real payment for MongoDB courses
      toast.info('Redirecting to payment...')
      
      const result = await createPaymentOrder(token, id)
      
      if (result.success && result.sessionUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.sessionUrl
      } else {
        toast.error(result.message || 'Failed to create payment session')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Error enrolling:', error)
      toast.error('Failed to process enrollment')
      setIsProcessing(false)
    }
  }

  if (!courseData) return <Loading />

  return (
    <>
      {/* HERO BACKGROUND */}
       <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-br from-gray-50 to-gray-100 -z-10">
       </div>

      <div className="px-6 md:px-36 pt-24 pb-16 grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-12">

        {/* LEFT CONTENT */}
        <div>

          {/* TITLE */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {courseData.courseTitle}
          </h1>

          <p
            className="text-base md:text-lg text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription.slice(0, 200) + '...',
            }}
          />

          {/* RATING */}
          <div className="flex flex-wrap items-center gap-3 pt-6 text-sm">
            <div className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold">
              <span className="text-lg">{calculateRating(courseData).toFixed(1)}</span>
              <img src={assets.star} className="w-4 h-4" alt="" />
            </div>

            <span className="text-gray-900 font-medium">
              ({courseData.courseRatings.length} ratings)
            </span>

            <span className="text-gray-700">
              • {courseData.enrolledStudents.length} students enrolled
            </span>
          </div>

          <p className="text-sm pt-3 text-gray-700">
            Created by <span className="text-blue-600 font-semibold underline">Edemy</span>
          </p>

          {/* COURSE STRUCTURE */}
          <div className="pt-16 md:pt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              Course Content
            </h2>

            <div className="bg-white rounded-xl shadow-xl p-2">
              {courseData.courseContent.map((chapter, index) => (
                <div
                  key={index}
                  className="border border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-lg mb-2 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Chapter Header */}
                  <div
                    className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        openSections[index] 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        <img
                          src={assets.down_arrow_icon}
                          alt=""
                          className={`w-4 transition-transform ${
                            openSections[index] ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      <p className="font-semibold text-gray-800">
                        {chapter.chapterTitle}
                      </p>
                    </div>

                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        {chapter.chapterContent.length} lectures
                      </span>
                      <span>· {calculateChapterTime(chapter)}</span>
                    </p>
                  </div>

                  {/* Lectures */}
                  {openSections[index] && (
                    <ul className="border-t border-gray-200 bg-white px-6 py-3 space-y-3">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-start text-sm hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <div className="flex gap-3 flex-1">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <img
                                src={assets.play_icon}
                                alt=""
                                className="w-4 h-4"
                              />
                            </div>
                            <p className="text-gray-700 font-medium">{lecture.lectureTitle}</p>
                          </div>

                          <div className="flex gap-3 text-gray-500 items-center">
                            {lecture.isPreviewFree && (
                              <button
                                onClick={() =>
                                  setPlayerData({
                                    videoId: getYouTubeVideoId(lecture.lectureUrl),
                                  })
                                }
                                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                              >
                                Preview
                              </button>
                            )}
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {humanizeDuration(
                                lecture.lectureDuration * 60 * 1000,
                                { units: ['h', 'm'] }
                              )}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FULL DESCRIPTION */}
          <div className="pt-20 bg-white rounded-xl shadow-lg p-8 mt-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              Course Description
            </h3>
            <div
              className="rich-text text-sm md:text-base text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
            />
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">

            {playerData ? (
              <YouTube
                videoId={playerData.videoId}
                opts={{ playerVars: { autoplay: 1 } }}
                iframeClassName="w-full aspect-video"
              />
            ) : (
              <div className="relative group">
                <img src={courseData.courseThumbnail} alt="" className="w-full" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <img src={assets.play_icon} className="w-8 h-8" alt="" />
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">

              <div className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">
                <img src={assets.time_clock_icon} className="w-4" alt="" />
                <span className="font-semibold">
                  5 days left at this price!
                </span>
              </div>

              {/* PRICE */}
              <div className="flex items-end gap-3 pt-4">
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {currency}
                  {(
                    courseData.coursePrice -
                    (courseData.discount * courseData.coursePrice) / 100
                  ).toFixed(2)}
                </p>

                <p className="line-through text-gray-400 text-lg">
                  {currency}{courseData.coursePrice}
                </p>

                <p className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-bold">
                  {courseData.discount}% OFF
                </p>
              </div>

              {/* META */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <img src={assets.star} alt="" className="w-4" />
                  </div>
                  <span className="font-medium">{calculateRating(courseData).toFixed(1)} rating</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <img src={assets.time_clock_icon} alt="" className="w-4" />
                  </div>
                  <span className="font-medium">{calculateCourseDuration(courseData)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <img src={assets.lesson_icon} alt="" className="w-4" />
                  </div>
                  <span className="font-medium">{calculateNoOfLectures(courseData)} lessons</span>
                </div>
              </div>

              <button 
                onClick={handleEnroll}
                disabled={isAlreadyEnrolled || isProcessing}
                className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isAlreadyEnrolled ? (
                  '✓ Already Enrolled'
                ) : (
                  '💳 Enroll Now - Pay with Stripe'
                )}
              </button>

              {/* BENEFITS */}
              <div className="pt-6">
                <p className="text-lg font-bold text-gray-800 mb-3">
                  What's included
                </p>
                <ul className="space-y-2">
                  {[
                    { icon: '∞', text: 'Lifetime access', color: 'blue' },
                    { icon: '🎯', text: 'Hands-on projects', color: 'purple' },
                    { icon: '📥', text: 'Downloadable resources', color: 'green' },
                    { icon: '🏆', text: 'Quizzes & certificate', color: 'yellow' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                      <div className={`w-8 h-8 bg-${item.color}-100 rounded-lg flex items-center justify-center text-lg`}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>

      </div>

      <Footer />
    </>
  )
}

export default CourseDetails
