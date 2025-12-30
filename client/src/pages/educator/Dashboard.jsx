import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useAuth } from '@clerk/clerk-react'
import { getEducatorDashboard } from '../../utils/api'
import ImprovedLoading from '../../components/students/ImprovedLoading'

const Dashboard = () => {

  const { currency } = useContext(AppContext)
  const { getToken } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        setLoading(false)
        return
      }
      
      // Try API first
      try {
        const result = await getEducatorDashboard(token)
        if (result.success) {
          setDashboardData(result.data)
          setLoading(false)
          return
        }
      } catch (apiError) {
        console.log('API failed, using localStorage data:', apiError.message)
      }
      
      // Fallback to localStorage data
      const userId = token ? JSON.parse(atob(token.split('.')[1])).sub : null
      if (userId) {
        const storageKey = `educatorCourses_${userId}`
        const savedCourses = localStorage.getItem(storageKey)
        
        if (savedCourses) {
          const courses = JSON.parse(savedCourses)
          
          // Calculate dashboard data from localStorage
          const totalEnrollments = courses.reduce((sum, course) => 
            sum + (course.enrolledStudents?.length || 0), 0
          )
          
          const totalEarnings = courses.reduce((sum, course) => {
            const price = course.coursePrice || 0
            const discount = course.discount || 0
            const finalPrice = price * (1 - discount / 100)
            const enrolled = course.enrolledStudents?.length || 0
            return sum + (finalPrice * enrolled)
          }, 0)
          
          // Create mock enrollment data
          const enrolledStudentsData = []
          courses.forEach(course => {
            if (course.enrolledStudents && course.enrolledStudents.length > 0) {
              course.enrolledStudents.forEach((studentId, index) => {
                enrolledStudentsData.push({
                  courseTitle: course.courseTitle,
                  student: {
                    _id: studentId,
                    name: `Student ${index + 1}`,
                    imageUrl: `https://i.pravatar.cc/150?img=${index + 1}`
                  }
                })
              })
            }
          })
          
          setDashboardData({
            totalCoursses: courses.length,
            totalEarnings: totalEarnings.toFixed(2),
            enrolledStudentsData: enrolledStudentsData
          })
        } else {
          // No courses yet
          setDashboardData({
            totalCoursses: 0,
            totalEarnings: '0.00',
            enrolledStudentsData: []
          })
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      // Set empty dashboard data
      setDashboardData({
        totalCoursses: 0,
        totalEarnings: '0.00',
        enrolledStudentsData: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ImprovedLoading />
  }

  if (!dashboardData) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-gray-500'>No data available</p>
      </div>
    )
  }

  return dashboardData ? (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8'>
      <div className='space-y-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
            Educator Dashboard
          </h1>
          <p className='text-gray-600'>Welcome back! Here's your overview</p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-white rounded-2xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-shadow'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                </svg>
              </div>
              <div>
                <p className='text-3xl font-bold text-gray-900'>{dashboardData.enrolledStudentsData.length}</p>
                <p className='text-sm text-gray-600 font-medium'>Total Enrollments</p>
              </div>
            </div>
            <div className='mt-4 pt-4 border-t border-gray-100'>
              <div className='flex items-center gap-2 text-sm text-green-600'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z' clipRule='evenodd' />
                </svg>
                <span className='font-semibold'>+12% this month</span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-xl p-6 border border-purple-100 hover:shadow-2xl transition-shadow'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                </svg>
              </div>
              <div>
                <p className='text-3xl font-bold text-gray-900'>{dashboardData.totalCoursses}</p>
                <p className='text-sm text-gray-600 font-medium'>Total Courses</p>
              </div>
            </div>
            <div className='mt-4 pt-4 border-t border-gray-100'>
              <div className='flex items-center gap-2 text-sm text-blue-600'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
                  <path fillRule='evenodd' d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z' clipRule='evenodd' />
                </svg>
                <span className='font-semibold'>{dashboardData.totalCoursses} published</span>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-xl p-6 border border-green-100 hover:shadow-2xl transition-shadow'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg'>
                <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <div>
                <p className='text-3xl font-bold text-gray-900'>{currency}{dashboardData.totalEarnings}</p>
                <p className='text-sm text-gray-600 font-medium'>Total Earnings</p>
              </div>
            </div>
            <div className='mt-4 pt-4 border-t border-gray-100'>
              <div className='flex items-center gap-2 text-sm text-green-600'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z' clipRule='evenodd' />
                </svg>
                <span className='font-semibold'>+8% this month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Enrollments Table */}
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100'>
          <div className='p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50'>
            <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
              <div className='w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full'></div>
              Latest Enrollments
            </h2>
          </div>
          
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden sm:table-cell'>#</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Student</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Course</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden md:table-cell'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {dashboardData.enrolledStudentsData.slice(0, 10).map((item, index)=> (
                  <tr key={index} className='hover:bg-blue-50/50 transition-colors'>
                    <td className='px-6 py-4 text-center hidden sm:table-cell'>
                      <span className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full inline-flex items-center justify-center font-bold text-sm'>
                        {index + 1}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <img 
                          src={item.student.imageUrl}
                          alt={item.student.name}
                          className='w-10 h-10 rounded-full border-2 border-blue-200 shadow-md'
                        />
                        <span className='font-medium text-gray-900'>{item.student.name}</span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-gray-900 font-semibold text-base'>{item.courseTitle}</span>
                    </td>
                    <td className='px-6 py-4 hidden md:table-cell'>
                      <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold'>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dashboardData.enrolledStudentsData.length > 10 && (
            <div className='p-4 bg-gray-50 border-t border-gray-200 text-center'>
              <button className='text-blue-600 hover:text-blue-700 font-medium text-sm'>
                View all {dashboardData.enrolledStudentsData.length} enrollments →
              </button>
            </div>
          )}
        </div>
      </div>        
    </div>
  ) : null
}

export default Dashboard