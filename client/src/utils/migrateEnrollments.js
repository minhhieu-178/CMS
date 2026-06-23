// Migration script to update old enrollments with new fields
export const migrateEnrollments = () => {
  console.log('🔄 Starting enrollment migration...')
  
  let migratedCount = 0
  
  // Migrate all myEnrollments_* keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    
    if (key && key.startsWith('myEnrollments_')) {
      try {
        const enrollments = JSON.parse(localStorage.getItem(key))
        
        if (!Array.isArray(enrollments)) continue
        
        const updated = enrollments.map(enrollment => {
          // Add missing fields
          const migrated = {
            ...enrollment,
            enrollmentType: enrollment.enrollmentType || 'demo',
            enrolledAt: enrollment.enrolledAt || enrollment.enrollmentDate || new Date().toISOString(),
            status: enrollment.status || 'active'
          }
          
          // Remove old field if exists
          if (migrated.enrollmentDate && !migrated.enrolledAt) {
            migrated.enrolledAt = migrated.enrollmentDate
          }
          delete migrated.enrollmentDate
          
          return migrated
        })
        
        localStorage.setItem(key, JSON.stringify(updated))
        migratedCount += updated.length
        console.log(`✅ Migrated ${key}: ${updated.length} enrollments`)
      } catch (error) {
        console.error(`❌ Error migrating ${key}:`, error)
      }
    }
  }
  
  // Also migrate old 'myEnrollments' key (backward compatibility)
  try {
    const oldEnrollments = localStorage.getItem('myEnrollments')
    if (oldEnrollments) {
      const enrollments = JSON.parse(oldEnrollments)
      if (Array.isArray(enrollments)) {
        const updated = enrollments.map(enrollment => ({
          ...enrollment,
          enrollmentType: enrollment.enrollmentType || 'demo',
          enrolledAt: enrollment.enrolledAt || enrollment.enrollmentDate || new Date().toISOString(),
          status: enrollment.status || 'active'
        }))
        localStorage.setItem('myEnrollments', JSON.stringify(updated))
        console.log(`✅ Migrated old myEnrollments: ${updated.length} enrollments`)
        migratedCount += updated.length
      }
    }
  } catch (error) {
    console.error('❌ Error migrating old myEnrollments:', error)
  }
  
  console.log(`✅ Migration complete! Total migrated: ${migratedCount} enrollments`)
  
  return migratedCount
}

// Auto-run migration on import (only once per session)
if (typeof window !== 'undefined' && !window.__enrollmentsMigrated) {
  migrateEnrollments()
  window.__enrollmentsMigrated = true
}
