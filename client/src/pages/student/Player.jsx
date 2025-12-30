import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import Footer from '../../components/students/Footer'
import Rating from '../../components/students/Rating'

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

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [playerData, setPlayerData] = useState(null)

  useEffect(() => {
    const course = enrolledCourses.find(c => c._id === courseId)
    if (course) setCourseData(course)
  }, [enrolledCourses, courseId])

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }))
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
                  {chapter.chapterContent.map((lecture, i) => (
                    <li
                      key={i}
                      className={`flex items-start justify-between gap-2 p-3 rounded-lg transition-all ${
                        playerData?.lecture === i + 1 && playerData?.chapter === index + 1
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          playerData?.lecture === i + 1 && playerData?.chapter === index + 1
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                            : 'bg-gray-200'
                        }`}>
                          <img
                            src={assets.play_icon}
                            alt="play"
                            className="w-4 h-4"
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-700">{lecture.lectureTitle}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {lecture.lectureUrl && (
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
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {humanizeDuration(lecture.lectureDuration * 60 * 1000, {
                            units: ['h', 'm'],
                          })}
                        </span>
                      </div>
                    </li>
                  ))}
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

                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg flex items-center gap-2">
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
