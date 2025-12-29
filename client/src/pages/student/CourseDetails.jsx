import { useContext, useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/students/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/students/Footer'
import YouTube from 'react-youtube'

const CourseDetails = () => {
  const { id } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
  const [playerData, setPlayerData] = useState(null)

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

  if (!courseData) return <Loading />

  return (
    <>
      {/* HERO BACKGROUND */}
       <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-b from-blue-50 -z-10"></div>

      <div className="px-6 md:px-36 pt-24 pb-16 grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-12">

        {/* LEFT CONTENT */}
        <div className="text-gray-700">

          {/* TITLE */}
          <h1 className="text-2xl md:text-4xl font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>

          <p
            className="pt-4 text-sm md:text-base"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription.slice(0, 200),
            }}
          />

          {/* RATING */}
          <div className="flex flex-wrap items-center gap-2 pt-4 text-sm">
            <span className="font-medium">{calculateRating(courseData)}</span>

            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <img
                  key={i}
                  src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank}
                  className="w-4 h-4"
                  alt=""
                />
              ))}
            </div>

            <span className="text-blue-600">
              ({courseData.courseRatings.length} ratings)
            </span>

            <span>
              {courseData.enrolledStudents.length} students
            </span>
          </div>

          <p className="text-sm pt-1">
            Course by <span className="text-blue-600 underline">Edemy</span>
          </p>

          {/* COURSE STRUCTURE */}
          <div className="pt-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Course Content
            </h2>

            {courseData.courseContent.map((chapter, index) => (
              <div
                key={index}
                className="border border-gray-200 bg-white rounded-lg mb-3 overflow-hidden"
              >
                {/* Chapter Header */}
                <div
                  className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={assets.down_arrow_icon}
                      alt=""
                      className={`w-4 transition-transform ${
                        openSections[index] ? 'rotate-90' : ''
                      }`}
                    />
                    <p className="font-medium">
                      {chapter.chapterTitle}
                    </p>
                  </div>

                  <p className="text-sm text-gray-500">
                    {chapter.chapterContent.length} lectures · {calculateChapterTime(chapter)}
                  </p>
                </div>

                {/* Lectures */}
                {openSections[index] && (
                  <ul className="border-t border-gray-200 px-6 py-3 space-y-2">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-start text-sm"
                      >
                        <div className="flex gap-2">
                          <img
                            src={assets.play_icon}
                            alt=""
                            className="w-4 h-4 mt-1"
                          />
                          <p>{lecture.lectureTitle}</p>
                        </div>

                        <div className="flex gap-3 text-gray-500">
                          {lecture.isPreviewFree && (
                            <button
                              onClick={() =>
                                setPlayerData({
                                  videoId: lecture.lectureUrl.split('/').pop(),
                                })
                              }
                              className="text-blue-600 hover:underline"
                            >
                              Preview
                            </button>
                          )}
                          <span>
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

          {/* FULL DESCRIPTION */}
          <div className="pt-20">
            <h3 className="text-xl font-semibold text-gray-800">
              Course Description
            </h3>
            <div
              className="pt-4 rich-text text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
            />
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="sticky top-24">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">

            {playerData ? (
              <YouTube
                videoId={playerData.videoId}
                opts={{ playerVars: { autoplay: 1 } }}
                iframeClassName="w-full aspect-video"
              />
            ) : (
              <img src={courseData.courseThumbnail} alt="" />
            )}

            <div className="p-6">

              <div className="flex items-center gap-2 text-sm text-red-500">
                <img src={assets.time_clock_icon} className="w-4" alt="" />
                <span>
                  <strong>5 days</strong> left at this price!
                </span>
              </div>

              {/* PRICE */}
              <div className="flex items-end gap-3 pt-3">
                <p className="text-3xl font-semibold text-gray-800">
                  {currency}
                  {(
                    courseData.coursePrice -
                    (courseData.discount * courseData.coursePrice) / 100
                  ).toFixed(2)}
                </p>

                <p className="line-through text-gray-500">
                  {currency}{courseData.coursePrice}
                </p>

                <p className="text-gray-500">
                  {courseData.discount}% off
                </p>
              </div>

              {/* META */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4">
                <div className="flex items-center gap-1">
                  <img src={assets.star} alt="" />
                  <span>{calculateRating(courseData)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <img src={assets.time_clock_icon} alt="" />
                  <span>{calculateCourseDuration(courseData)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <img src={assets.lesson_icon} alt="" />
                  <span>{calculateNoOfLectures(courseData)} lessons</span>
                </div>
              </div>

              <button className="mt-6 w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                {isAlreadyEnrolled ? 'Already Enrolled' : 'Enroll Now'}
              </button>

              {/* BENEFITS */}
              <div className="pt-6">
                <p className="text-lg font-medium text-gray-800">
                  What's included
                </p>
                <ul className="list-disc ml-5 pt-2 text-sm text-gray-500 space-y-1">
                  <li>Lifetime access</li>
                  <li>Hands-on projects</li>
                  <li>Downloadable resources</li>
                  <li>Quizzes & certificate</li>
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
