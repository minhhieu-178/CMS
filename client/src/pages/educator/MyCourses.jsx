import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useAuth, useUser } from '@clerk/clerk-react'
import { getEducatorCourses, deleteCourse } from '../../utils/api'
import ImprovedLoading from '../../components/students/ImprovedLoading'
import { toast } from 'react-toastify'

const MyCourses = () => {

  const {currency, navigate} = useContext(AppContext)
  const { getToken } = useAuth()
  const { user } = useUser()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        setLoading(false)
        return
      }
      
      // 1. Try to fetch from MongoDB API first
      try {
        const token = await getToken()
        if (token) {
          const result = await getEducatorCourses(token)
          
          if (result.success && result.courses) {
            console.log('☁️ Loaded educator courses from MongoDB:', result.courses.length)
            setCourses(result.courses)
            
            // Save to LocalStorage for offline access
            const storageKey = `educatorCourses_${user.id}`
            localStorage.setItem(storageKey, JSON.stringify(result.courses))
            
            // Also update globalCourses
            const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]')
            const existingIds = new Set(globalCourses.map(c => c._id))
            
            result.courses.forEach(course => {
              if (!existingIds.has(course._id)) {
                globalCourses.push(course)
              } else {
                // Update existing course
                const index = globalCourses.findIndex(c => c._id === course._id)
                if (index !== -1) {
                  globalCourses[index] = course
                }
              }
            })
            
            localStorage.setItem('globalCourses', JSON.stringify(globalCourses))
            
            setLoading(false)
            return
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Could not fetch from MongoDB API, using LocalStorage:', apiError.message)
      }
      
      // 2. Fallback to LocalStorage if API fails
      const storageKey = `educatorCourses_${user.id}`
      const storedCourses = localStorage.getItem(storageKey)
      
      if (storedCourses) {
        const parsedCourses = JSON.parse(storedCourses)
        console.log('💾 Loaded courses from LocalStorage:', parsedCourses.length)
        setCourses(parsedCourses)
      } else {
        console.log('📦 No courses found in LocalStorage')
        setCourses([])
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`)) {
      return
    }

    try {
      setDeleting(courseId)
      
      if (!user) {
        toast.error('User not found')
        return
      }
      
      // Delete from LocalStorage
      const storageKey = `educatorCourses_${user.id}`
      const storedCourses = localStorage.getItem(storageKey)
      
      if (storedCourses) {
        const parsedCourses = JSON.parse(storedCourses)
        const updatedCourses = parsedCourses.filter(c => c._id !== courseId)
        
        // Save back to LocalStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedCourses))
        
        // Also remove from globalCourses
        const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]')
        const updatedGlobalCourses = globalCourses.filter(c => c._id !== courseId)
        localStorage.setItem('globalCourses', JSON.stringify(updatedGlobalCourses))
        
        // Update local state
        setCourses(updatedCourses)
        
        // Dispatch event to notify AppContext to reload courses
        window.dispatchEvent(new Event('coursesUpdated'))
        
        toast.success('Course deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <ImprovedLoading />
  }

  return courses ? (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8'>
      <div className='w-full'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
            My Courses
          </h1>
          <p className='text-gray-600'>Manage and track your course performance</p>
        </div>

        {/* Courses Table */}
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Course</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Earnings</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Students</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden md:table-cell'>Published</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden lg:table-cell'>Status</th>
                  <th className='px-6 py-4 text-center text-sm font-semibold text-gray-700'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {courses.map((course) =>(
                  <tr key={course._id} className='hover:bg-blue-50/50 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-4'>
                        <img 
                          src={course.courseThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'} 
                          alt={course.courseTitle}
                          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                          className='w-20 h-14 rounded-lg object-cover shadow-md border border-gray-200'
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-lg text-gray-900 leading-snug'>{course.courseTitle}</p>
                          <p className='text-xs text-gray-500 mt-1'>
                            {course.courseContent?.length || 0} chapters
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                          <svg className='w-4 h-4 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                          </svg>
                        </div>
                        <span className='font-bold text-gray-900'>
                          {currency} {Math.floor(course.enrolledStudents.length * (course.coursePrice - course.discount * course.coursePrice / 100))}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                          <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                          </svg>
                        </div>
                        <span className='font-bold text-gray-900'>{course.enrolledStudents.length}</span>
                      </div>
                    </td>
                    <td className='px-6 py-4 hidden md:table-cell'>
                      <span className='text-sm text-gray-600'>
                        {new Date(course.createAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td className='px-6 py-4 hidden lg:table-cell'>
                      <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center gap-1'>
                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                        </svg>
                        Published
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex gap-2 justify-center'>
                        <button
                          onClick={() => navigate(`/educator/edit-course/${course._id}`)}
                          className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2'
                          title='Edit Course'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/educator/course/${course._id}/quizzes`)}
                          className='px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2'
                          title='Manage Quizzes'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' />
                          </svg>
                          Quizzes
                        </button>
                        <button
                          onClick={() => handleDelete(course._id, course.courseTitle)}
                          disabled={deleting === course._id}
                          className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                        >
                          {deleting === course._id ? (
                            <>
                              <svg className='animate-spin h-4 w-4' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {courses.length === 0 && (
            <div className='text-center py-16'>
              <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>No courses yet</h3>
              <p className='text-gray-600 mb-6'>Start creating your first course</p>
              <button 
                onClick={() => navigate('/educator/add-course')}
                className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg'
              >
                Create Course
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {courses.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-8'>
            <div className='bg-white rounded-xl shadow-lg p-6 border border-blue-100'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                  </svg>
                </div>
                <span className='text-sm text-gray-600 font-medium'>Total Courses</span>
              </div>
              <p className='text-3xl font-bold text-gray-900'>{courses.length}</p>
            </div>

            <div className='bg-white rounded-xl shadow-lg p-6 border border-purple-100'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                  </svg>
                </div>
                <span className='text-sm text-gray-600 font-medium'>Total Students</span>
              </div>
              <p className='text-3xl font-bold text-gray-900'>
                {courses.reduce((sum, course) => sum + course.enrolledStudents.length, 0)}
              </p>
            </div>

            <div className='bg-white rounded-xl shadow-lg p-6 border border-green-100'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                  <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <span className='text-sm text-gray-600 font-medium'>Total Revenue</span>
              </div>
              <p className='text-3xl font-bold text-gray-900'>
                {currency}{courses.reduce((sum, course) => 
                  sum + Math.floor(course.enrolledStudents.length * (course.coursePrice - course.discount * course.coursePrice / 100)), 0
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null
}

export default MyCourses