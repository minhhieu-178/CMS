import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useUser } from '@clerk/clerk-react'

const DebugEnrollments = () => {
  const { user } = useUser()
  const { allCourses, enrolledCourses } = useContext(AppContext)
  const [localStorageData, setLocalStorageData] = useState(null)

  useEffect(() => {
    if (user?.id) {
      const storageKey = `myEnrollments_${user.id}`
      const data = localStorage.getItem(storageKey)
      setLocalStorageData(data)
    }
  }, [user])

  const handleForceReload = () => {
    window.location.reload()
  }

  const handleClearEnrollments = () => {
    if (user?.id && window.confirm('Clear all enrollments?')) {
      const storageKey = `myEnrollments_${user.id}`
      localStorage.removeItem(storageKey)
      alert('Enrollments cleared! Reloading...')
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Enrollments</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">User Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Name:</strong> {user?.fullName || user?.firstName || 'N/A'}</p>
            <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'N/A'}</p>
          </div>
        </div>

        {/* LocalStorage Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">LocalStorage Data</h2>
          <div className="space-y-2">
            <p className="font-mono text-sm">
              <strong>Key:</strong> myEnrollments_{user?.id}
            </p>
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              <pre className="text-xs">
                {localStorageData || 'No data found'}
              </pre>
            </div>
            {localStorageData && (
              <div className="mt-4">
                <p className="font-bold mb-2">Parsed Data:</p>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-xs">
                  {JSON.stringify(JSON.parse(localStorageData), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* All Courses */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">All Courses ({allCourses.length})</h2>
          <div className="space-y-2">
            {allCourses.map((course, idx) => (
              <div key={idx} className="border-b pb-2">
                <p className="font-semibold">{course.courseTitle}</p>
                <p className="text-sm text-gray-600 font-mono">ID: {course._id}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enrolled Courses from Context */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            Enrolled Courses from Context ({enrolledCourses.length})
          </h2>
          {enrolledCourses.length === 0 ? (
            <p className="text-red-600">No enrolled courses found in context!</p>
          ) : (
            <div className="space-y-2">
              {enrolledCourses.map((course, idx) => (
                <div key={idx} className="border-b pb-2">
                  <p className="font-semibold">{course.courseTitle}</p>
                  <p className="text-sm text-gray-600 font-mono">ID: {course._id}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={handleForceReload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Force Reload Page
            </button>
            <button
              onClick={handleClearEnrollments}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All Enrollments
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event('enrollmentsUpdated'))}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Trigger Reload Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugEnrollments
