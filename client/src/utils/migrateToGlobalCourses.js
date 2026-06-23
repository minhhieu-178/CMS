// Migration script to move all user-specific courses to global storage
// This ensures all users can see all courses

export const migrateToGlobalCourses = () => {
  console.log('🔄 Starting course migration to global storage...')
  
  try {
    // Get existing global courses
    let globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]')
    const existingIds = new Set(globalCourses.map(c => c._id))
    let migratedCount = 0
    
    // Scan all localStorage keys for user-specific courses
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith('educatorCourses_')) {
        try {
          const courses = JSON.parse(localStorage.getItem(key))
          
          if (Array.isArray(courses)) {
            // Add courses that don't exist in global storage yet
            courses.forEach(course => {
              if (!existingIds.has(course._id)) {
                globalCourses.push(course)
                existingIds.add(course._id)
                migratedCount++
              }
            })
            
            console.log(`✅ Migrated ${courses.length} courses from ${key}`)
          }
        } catch (error) {
          console.error(`Error migrating courses from ${key}:`, error)
        }
      }
    }
    
    // Save to global storage
    if (migratedCount > 0) {
      localStorage.setItem('globalCourses', JSON.stringify(globalCourses))
      console.log(`✅ Migration complete! Added ${migratedCount} new courses to global storage`)
      console.log(`📊 Total courses in global storage: ${globalCourses.length}`)
    } else {
      console.log('ℹ️ No new courses to migrate')
    }
    
    return {
      success: true,
      migratedCount,
      totalCourses: globalCourses.length
    }
  } catch (error) {
    console.error('❌ Error during course migration:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Auto-run migration on import
migrateToGlobalCourses()
