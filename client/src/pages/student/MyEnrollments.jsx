import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import {Line} from 'rc-progress' 
import Footer from '../../components/students/Footer'

const MyEnrollments = () => {

  const {enrolledCourses, calculateCourseDuration, navigate} = useContext(AppContext)

  const [progressArray, setProgressArray] = useState([
    {lectureCompleted: 2, totalLectures: 4},
    {lectureCompleted: 1, totalLectures: 5},
    {lectureCompleted: 3, totalLectures: 6},
    {lectureCompleted: 4, totalLectures: 4},
    {lectureCompleted: 0, totalLectures: 3},
    {lectureCompleted: 5, totalLectures: 7},
    {lectureCompleted: 6, totalLectures: 8},
    {lectureCompleted: 2, totalLectures: 6},
    {lectureCompleted: 4, totalLectures: 10},
    {lectureCompleted: 3, totalLectures: 5},
    {lectureCompleted: 7, totalLectures: 7},
    {lectureCompleted: 1, totalLectures: 4},
    {lectureCompleted: 0, totalLectures: 2},
    {lectureCompleted: 5, totalLectures: 5}
  ])

  // Reload enrollments when component mounts
  useEffect(() => {
    console.log('MyEnrollments mounted, enrolled courses:', enrolledCourses.length)
    // Trigger reload
    window.dispatchEvent(new Event('enrollmentsUpdated'))
  }, [])

  const getProgressPercentage = (index) => {
    if (!progressArray[index]) return 0
    return (progressArray[index].lectureCompleted * 100) / progressArray[index].totalLectures
  }

  const isCompleted = (index) => {
    if (!progressArray[index]) return false
    return progressArray[index].lectureCompleted === progressArray[index].totalLectures
  }

  return (
    <>
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
      <div className='md:px-36 px-8 pt-10 pb-16'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
            My Enrollments
          </h1>
          <p className='text-gray-600'>Track your learning progress and continue where you left off</p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
          <div className='bg-white rounded-xl shadow-md p-6 border border-blue-100'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                </svg>
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>{enrolledCourses.length}</p>
                <p className='text-sm text-gray-600'>Total Courses</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-md p-6 border border-green-100'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>
                  {progressArray.filter((p, i) => isCompleted(i)).length}
                </p>
                <p className='text-sm text-gray-600'>Completed</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-md p-6 border border-purple-100'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>
                  {progressArray.filter((p, i) => !isCompleted(i) && p.lectureCompleted > 0).length}
                </p>
                <p className='text-sm text-gray-600'>In Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className='bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200'>
          <table className='w-full'>
            <thead className='bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Course</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 max-sm:hidden'>Duration</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 max-sm:hidden'>Progress</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {enrolledCourses.map((course, index)=>(
                <tr key={index} className='hover:bg-blue-50/50 transition-colors'>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-4'>
                      <img 
                        src={course.courseThumbnail} 
                        alt={course.courseTitle}
                        className='w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-md' 
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='font-semibold text-lg text-gray-900 mb-2 leading-snug'>{course.courseTitle}</p>
                        <div className='flex items-center gap-2'>
                          <Line 
                            strokeWidth={3} 
                            percent={getProgressPercentage(index)} 
                            strokeColor={isCompleted(index) ? '#10b981' : '#3b82f6'}
                            className='bg-gray-200 rounded-full flex-1'
                          />
                          <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>
                            {Math.round(getProgressPercentage(index))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-gray-700 max-sm:hidden'>
                    <div className='flex items-center gap-2'>
                      <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                      {calculateCourseDuration(course)}
                    </div>
                  </td>
                  <td className='px-6 py-4 text-gray-700 max-sm:hidden'>
                    {progressArray[index] && (
                      <span className='text-sm'>
                        <span className='font-semibold text-blue-600'>{progressArray[index].lectureCompleted}</span>
                        <span className='text-gray-400'> / </span>
                        <span className='font-semibold'>{progressArray[index].totalLectures}</span>
                        <span className='text-gray-500 ml-1'>lectures</span>
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <button 
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all transform hover:scale-105 shadow-md ${
                        isCompleted(index)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      }`}
                      onClick={()=> navigate('/player/' + course._id)}
                    >
                      {isCompleted(index) ? '✓ Completed' : 'Continue'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {enrolledCourses.length === 0 && (
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>No enrollments yet</h3>
            <p className='text-gray-600 mb-6'>Start learning by enrolling in a course</p>
            <button 
              onClick={() => navigate('/course-list')}
              className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg'
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    </div>
    <Footer/>
    </>
  )
}

export default MyEnrollments