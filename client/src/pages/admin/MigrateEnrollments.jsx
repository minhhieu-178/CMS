import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

const MigrateEnrollments = () => {
  const { getToken } = useAuth()
  const [migrating, setMigrating] = useState(false)
  const [results, setResults] = useState(null)

  const migrateEnrollments = async () => {
    try {
      setMigrating(true)
      const token = await getToken()
      
      let allEnrollments = []
      
      // Scan all localStorage keys for enrollments
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        
        if (key && key.startsWith('myEnrollments_')) {
          try {
            const enrollments = JSON.parse(localStorage.getItem(key))
            const userId = key.replace('myEnrollments_', '')
            
            console.log(`Found ${enrollments.length} enrollments for user ${userId}`)
            
            // Add userId to each enrollment
            enrollments.forEach(enrollment => {
              allEnrollments.push({
                studentId: userId,
                courseId: enrollment.courseId,
                enrolledAt: enrollment.enrolledAt || enrollment.enrollmentDate || new Date().toISOString(),
                enrollmentType: enrollment.enrollmentType || 'Free'
              })
            })
          } catch (error) {
            console.error(`Error processing ${key}:`, error)
          }
        }
      }
      
      console.log(`Total enrollments to migrate: ${allEnrollments.length}`)
      
      if (allEnrollments.length === 0) {
        toast.error('No enrollments found in localStorage')
        setMigrating(false)
        return
      }
      
      // Send to backend for migration
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/migration/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enrollments: allEnrollments })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setResults(result.stats)
        toast.success(`Successfully migrated ${result.stats.migrated} enrollments!`)
      } else {
        toast.error('Migration failed: ' + result.message)
      }
      
    } catch (error) {
      console.error('Migration error:', error)
      toast.error('Migration failed: ' + error.message)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Migrate Enrollments to MongoDB
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              ⚠️ This will migrate all enrollments from localStorage to MongoDB.
              Make sure you're logged in as the correct user.
            </p>
          </div>

          <button
            onClick={migrateEnrollments}
            disabled={migrating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {migrating ? 'Migrating...' : 'Start Migration'}
          </button>

          {results && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Migration Results</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>📊 Total found: {results.total}</li>
                  <li>✅ Successfully migrated: {results.migrated}</li>
                  <li>⏭️ Skipped (already exists): {results.skipped}</li>
                  {results.errors > 0 && (
                    <li className="text-red-600">❌ Errors: {results.errors}</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Make sure you have enrollments in localStorage</li>
              <li>Click "Start Migration" button</li>
              <li>Wait for the process to complete</li>
              <li>Check MongoDB to verify the data</li>
              <li>Test enrollment features to ensure everything works</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MigrateEnrollments
