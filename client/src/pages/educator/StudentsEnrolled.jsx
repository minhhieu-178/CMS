import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { getEnrolledStudents } from '../../utils/api'
import ImprovedLoading from '../../components/students/ImprovedLoading'

const StudentsEnrolled = () => {

  const { getToken } = useAuth()
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        setLoading(false)
        return
      }
      
      const result = await getEnrolledStudents(token)
      if (result.success) {
        // Transform data to match expected format
        const transformedData = result.enrollments.map(enrollment => ({
          student: enrollment.studentId,
          courseTitle: enrollment.courseId.courseTitle,
          purchaseDate: enrollment.enrollmentDate
        }))
        setEnrolledStudents(transformedData)
      } else {
        console.error('Failed to fetch students:', result.message)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ImprovedLoading />
  }
  
  return enrolledStudents ? (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
          Students Enrolled
        </h1>
        <p className='text-gray-600'>View all students enrolled in your courses</p>
      </div>

      {/* Students Table */}
      <div className='bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden sm:table-cell'>#</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Student</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700'>Course</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden sm:table-cell'>Enrolled Date</th>
                <th className='px-6 py-4 text-left text-sm font-semibold text-gray-700 hidden md:table-cell'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {enrolledStudents.map((item, index)=> (
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
                      <div>
                        <p className='font-semibold text-gray-900'>{item.student.name}</p>
                        <p className='text-xs text-gray-500'>{item.student.email || 'student@example.com'}</p>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <span className='font-semibold text-gray-900 text-base'>{item.courseTitle}</span>
                  </td>
                  <td className='px-6 py-4 hidden sm:table-cell'>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                      </svg>
                      {new Date(item.purchaseDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  </td>
                  <td className='px-6 py-4 hidden md:table-cell'>
                    <span className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold inline-flex items-center gap-1'>
                      <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                      </svg>
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {enrolledStudents.length === 0 && (
          <div className='text-center py-16'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>No students yet</h3>
            <p className='text-gray-600'>Students will appear here once they enroll in your courses</p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      {enrolledStudents.length > 0 && (
        <div className='mt-8 bg-white rounded-xl shadow-lg p-6 border border-blue-100'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 font-medium mb-1'>Total Students</p>
              <p className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                {enrolledStudents.length}
              </p>
            </div>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
              <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null
}

export default StudentsEnrolled