import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { autoMigrateToMongoDB } from '../utils/migrateLocalStorageToMongoDB'
import { migrateDummyCoursesToMongoDB } from '../utils/migrateDummyCoursesToMongoDB'

const DebugLocalStorage = () => {
  const { getToken } = useAuth()
  const [localStorageData, setLocalStorageData] = useState({})
  const [migrating, setMigrating] = useState(false)
  const [migratingDummy, setMigratingDummy] = useState(false)

  useEffect(() => {
    loadLocalStorageData()
  }, [])

  const loadLocalStorageData = () => {
    const data = {}
    
    // Check globalCourses
    try {
      const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]')
      data.globalCourses = globalCourses
    } catch (error) {
      data.globalCourses = { error: error.message }
    }
    
    // Check user-specific courses
    data.userCourses = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith('educatorCourses_')) {
        try {
          const courses = JSON.parse(localStorage.getItem(key))
          data.userCourses[key] = courses
        } catch (error) {
          data.userCourses[key] = { error: error.message }
        }
      }
    }
    
    // Check migration status
    data.migrationCompleted = localStorage.getItem('mongoDBMigrationCompleted') === 'true'
    
    // All keys
    data.allKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      data.allKeys.push(localStorage.key(i))
    }
    
    setLocalStorageData(data)
  }

  const handleManualMigration = async () => {
    setMigrating(true)
    try {
      await autoMigrateToMongoDB(getToken)
      alert('Migration completed! Check console for details.')
      loadLocalStorageData()
    } catch (error) {
      alert('Migration failed: ' + error.message)
    } finally {
      setMigrating(false)
    }
  }

  const handleResetMigration = () => {
    localStorage.removeItem('mongoDBMigrationCompleted')
    alert('Migration flag reset! Reload page to run migration again.')
    loadLocalStorageData()
  }

  const handleMigrateDummyCourses = async () => {
    if (!window.confirm('This will upload all dummy courses from assets.js to MongoDB. Continue?')) {
      return
    }
    
    setMigratingDummy(true)
    try {
      const result = await migrateDummyCoursesToMongoDB(getToken)
      
      if (result.success) {
        alert(`✅ Migration complete!\n\nUploaded: ${result.uploaded}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`)
      } else {
        alert('❌ Migration failed: ' + result.message)
      }
      
      loadLocalStorageData()
    } catch (error) {
      alert('❌ Migration failed: ' + error.message)
    } finally {
      setMigratingDummy(false)
    }
  }

  const totalCourses = 
    (localStorageData.globalCourses?.length || 0) +
    Object.values(localStorageData.userCourses || {}).reduce((sum, courses) => 
      sum + (Array.isArray(courses) ? courses.length : 0), 0
    )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🔍 LocalStorage Debug
          </h1>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-3xl font-bold text-blue-600">{totalCourses}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Global Courses</p>
              <p className="text-3xl font-bold text-green-600">
                {localStorageData.globalCourses?.length || 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Migration Status</p>
              <p className="text-lg font-bold text-purple-600">
                {localStorageData.migrationCompleted ? '✅ Done' : '❌ Pending'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={handleManualMigration}
              disabled={migrating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {migrating ? 'Migrating...' : '🚀 Migrate LocalStorage Courses'}
            </button>
            <button
              onClick={handleMigrateDummyCourses}
              disabled={migratingDummy}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
            >
              {migratingDummy ? 'Uploading...' : '📚 Upload Dummy Courses to MongoDB'}
            </button>
            <button
              onClick={handleResetMigration}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
            >
              🔄 Reset Migration Flag
            </button>
            <button
              onClick={loadLocalStorageData}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              ♻️ Refresh Data
            </button>
          </div>

          {/* Global Courses */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📦 Global Courses ({localStorageData.globalCourses?.length || 0})
            </h2>
            {localStorageData.globalCourses?.length > 0 ? (
              <div className="space-y-2">
                {localStorageData.globalCourses.map((course, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-800">{course.courseTitle}</p>
                    <p className="text-sm text-gray-600">ID: {course._id}</p>
                    <p className="text-sm text-gray-600">Category: {course.courseCategory}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No global courses found</p>
            )}
          </div>

          {/* User Courses */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              👤 User-Specific Courses
            </h2>
            {Object.keys(localStorageData.userCourses || {}).length > 0 ? (
              Object.entries(localStorageData.userCourses).map(([key, courses]) => (
                <div key={key} className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">{key}</h3>
                  {Array.isArray(courses) ? (
                    <div className="space-y-2">
                      {courses.map((course, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 ml-4">
                          <p className="font-semibold text-gray-800">{course.courseTitle}</p>
                          <p className="text-sm text-gray-600">ID: {course._id}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-500 ml-4">Error: {courses.error}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No user-specific courses found</p>
            )}
          </div>

          {/* All Keys */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🔑 All LocalStorage Keys ({localStorageData.allKeys?.length || 0})
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(localStorageData.allKeys, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugLocalStorage
