import { useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const MigrateLocalCourses = () => {
  const { getToken } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [localCourses, setLocalCourses] = useState([])

  // Load courses from localStorage
  const loadLocalCourses = () => {
    if (!user?.id) {
      toast.error('Please sign in first')
      return
    }

    const storageKey = `educatorCourses_${user.id}`
    const savedCourses = localStorage.getItem(storageKey)
    
    if (savedCourses) {
      try {
        const courses = JSON.parse(savedCourses)
        setLocalCourses(courses)
        toast.info(`Found ${courses.length} courses in localStorage`)
      } catch (error) {
        toast.error('Error loading courses from localStorage')
      }
    } else {
      toast.info('No courses found in localStorage')
    }
  }

  // Migrate courses to MongoDB
  const migrateCourses = async () => {
    if (localCourses.length === 0) {
      toast.error('No courses to migrate')
      return
    }

    setLoading(true)
    const token = await getToken()
    let successCount = 0
    let failCount = 0

    for (const course of localCourses) {
      try {
        // Create FormData for each course
        const formData = new FormData()
        
        // Prepare course data without thumbnail
        const courseDataToSend = {
          courseTitle: course.courseTitle,
          courseDescription: course.courseDescription,
          coursePrice: course.coursePrice,
          discount: course.discount,
          courseContent: course.courseContent,
          isPublished: course.isPublished || true
        }
        
        formData.append('courseData', JSON.stringify(courseDataToSend))
        
        // If course has thumbnail URL, try to fetch and upload it
        if (course.courseThumbnail && !course.courseThumbnail.includes('cloudinary')) {
          try {
            const response = await fetch(course.courseThumbnail)
            const blob = await response.blob()
            formData.append('thumbnail', blob, 'thumbnail.jpg')
          } catch (error) {
            console.log('Could not fetch thumbnail, skipping:', error)
          }
        }

        // Upload to backend
        const backendUrl = import.meta.env.VITE_BACKEND_URL
        const result = await fetch(`${backendUrl}/api/educator/add-course`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        const data = await result.json()
        
        if (data.success) {
          successCount++
        } else {
          failCount++
          console.error('Failed to migrate course:', course.courseTitle, data.message)
        }
      } catch (error) {
        failCount++
        console.error('Error migrating course:', course.courseTitle, error)
      }
    }

    setLoading(false)
    
    if (successCount > 0) {
      toast.success(`Successfully migrated ${successCount} courses!`)
      
      // Clear localStorage after successful migration
      if (failCount === 0) {
        const storageKey = `educatorCourses_${user.id}`
        localStorage.removeItem(storageKey)
        toast.info('LocalStorage cleared')
      }
      
      setTimeout(() => {
        navigate('/educator/my-courses')
      }, 2000)
    }
    
    if (failCount > 0) {
      toast.error(`Failed to migrate ${failCount} courses`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Migrate Local Courses to Cloud
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ What is this?</h3>
            <p className="text-blue-800 text-sm">
              This tool helps you migrate courses from your browser's localStorage to the cloud database (MongoDB).
              After migration, your courses will be accessible from any device and will appear in search results.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <button
                onClick={loadLocalCourses}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                1. Load Courses from LocalStorage
              </button>
            </div>

            {localCourses.length > 0 && (
              <>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Found {localCourses.length} courses:
                  </h3>
                  <ul className="space-y-2">
                    {localCourses.map((course, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{course.courseTitle}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <button
                    onClick={migrateCourses}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Migrating...
                      </span>
                    ) : (
                      '2. Migrate to Cloud Database'
                    )}
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h3>
                  <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
                    <li>This process may take a few minutes depending on the number of courses</li>
                    <li>Thumbnails will be re-uploaded to Cloudinary</li>
                    <li>LocalStorage will be cleared after successful migration</li>
                    <li>You can only migrate courses that you created</li>
                  </ul>
                </div>
              </>
            )}

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/educator')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MigrateLocalCourses
