import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import Footer from '../../components/students/Footer'
import Rating from '../../components/students/Rating'

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
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 sm:p-8 md:px-36 grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-10">

        {/* LEFT: COURSE STRUCTURE */}
        <div className="bg-white rounded-xl shadow-md p-6 max-h-[75vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Course Structure</h2>

          {courseData && courseData.courseContent.map((chapter, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg mb-3 bg-gray-50"
            >
              {/* Chapter header */}
              <div
                className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={assets.down_arrow_icon}
                    alt="arrow"
                    className={`w-4 transition-transform ${
                      openSections[index] ? 'rotate-90' : ''
                    }`}
                  />
                  <p className="font-medium text-sm md:text-base">
                    {chapter.chapterTitle}
                  </p>
                </div>

                <p className="text-xs md:text-sm text-gray-600">
                  {chapter.chapterContent.length} lectures · {calculateChapterTime(chapter)}
                </p>
              </div>

              {/* Lectures */}
              {openSections[index] && (
                <ul className="border-t border-gray-200 px-4 py-2 space-y-2">
                  {chapter.chapterContent.map((lecture, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div className="flex gap-2">
                        <img
                          src={assets.play_icon}
                          alt="play"
                          className="w-4 h-4 mt-1"
                        />
                        <p>{lecture.lectureTitle}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        {lecture.lectureUrl && (
                          <button
                            onClick={() =>
                              setPlayerData({
                                ...lecture,
                                chapter: index + 1,
                                lecture: i + 1,
                              })
                            }
                            className="text-blue-600 hover:underline"
                          >
                            Watch
                          </button>
                        )}
                        <span>
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

          <div className="mt-8">
            <h3 className="text-lg font-semibold">Rate this Course:</h3>
            <Rating initialRating={0}/>
          </div>
        </div>

        {/* RIGHT: VIDEO PLAYER */}
        <div className="sticky top-24 h-fit">
          <div className="bg-white rounded-xl shadow-lg p-4">

            {playerData ? (
              <>
                <div className="w-full aspect-video overflow-hidden rounded-md bg-black">
                  <YouTube
                    videoId={playerData.lectureUrl.split('/').pop()}
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

                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm font-medium">
                    {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
                  </p>

                  <button className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs hover:bg-blue-700 transition">
                    Mark Complete
                  </button>
                </div>
              </>
            ) : (
              <img
                src={courseData?.courseThumbnail}
                alt="Course thumbnail"
                className="rounded-md"
              />
            )}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  )
}

export default Player
