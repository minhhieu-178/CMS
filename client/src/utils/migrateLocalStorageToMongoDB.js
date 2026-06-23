// Auto-migration script - runs once on app startup
// Migrates LocalStorage courses to MongoDB automatically

let migrationRunning = false
let migrationCompleted = false

export const autoMigrateToMongoDB = async (getToken) => {
  // Check if migration already ran in this session
  if (migrationRunning || migrationCompleted) {
    return
  }
  
  // ALWAYS check LocalStorage for courses, even if migration flag is set
  // This ensures we don't skip migration if there's actually data
  
  migrationRunning = true
  console.log('🔄 Auto-migration: Checking for LocalStorage courses...')
  
  try {
    const token = await getToken()
    if (!token) {
      console.log('⏸️ No auth token yet, skipping migration')
      migrationRunning = false
      return
    }
    
    // 1. Collect all courses from LocalStorage
    let allLocalCourses = []
    
    // Check globalCourses
    try {
      const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]')
      if (globalCourses.length > 0) {
        allLocalCourses = [...globalCourses]
        console.log(`📦 Found ${globalCourses.length} courses in globalCourses`)
      }
    } catch (error) {
      console.error('Error reading globalCourses:', error)
    }
    
    // Check user-specific courses
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith('educatorCourses_')) {
        try {
          const courses = JSON.parse(localStorage.getItem(key))
          
          if (Array.isArray(courses)) {
            const existingIds = new Set(allLocalCourses.map(c => c._id))
            courses.forEach(course => {
              if (!existingIds.has(course._id)) {
                allLocalCourses.push(course)
                existingIds.add(course._id)
              }
            })
            console.log(`📦 Found ${courses.length} courses in ${key}`)
          }
        } catch (error) {
          console.error(`Error reading ${key}:`, error)
        }
      }
    }
    
    if (allLocalCourses.length === 0) {
      console.log('⚠️ No LocalStorage courses found!')
      console.log('💡 Tip: Go to /debug-localstorage to check your data')
      migrationCompleted = true
      migrationRunning = false
      return
    }
    
    // Check if already migrated
    const migrationStatus = localStorage.getItem('mongoDBMigrationCompleted')
    if (migrationStatus === 'true') {
      console.log(`ℹ️ Migration flag is set, but found ${allLocalCourses.length} courses`)
      console.log('💡 Go to /debug-localstorage to manually migrate if needed')
      migrationCompleted = true
      migrationRunning = false
      return
    }
    
    console.log(`📦 Found ${allLocalCourses.length} courses in LocalStorage`)
    console.log('⬆️ Starting auto-migration to MongoDB...')
    
    // 2. Upload each course to MongoDB
    let successCount = 0
    let skipCount = 0
    
    for (const course of allLocalCourses) {
      try {
        const courseData = {
          courseTitle: course.courseTitle,
          courseDescription: course.courseDescription,
          courseCategory: course.courseCategory,
          coursePrice: course.coursePrice,
          discount: course.discount || 0,
          courseThumbnail: course.courseThumbnail,
          courseContent: course.courseContent,
          courseLevel: course.courseLevel || 'Beginner',
          courseLanguage: course.courseLanguage || 'English'
        }
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/educator/add-course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(courseData)
        })
        
        const data = await response.json()
        
        if (data.success) {
          successCount++
          console.log(`✅ Migrated: ${course.courseTitle}`)
        } else {
          // If course already exists, that's OK
          if (data.message && data.message.includes('already exists')) {
            skipCount++
            console.log(`⏭️ Skipped (exists): ${course.courseTitle}`)
          } else {
            console.warn(`⚠️ Failed: ${course.courseTitle} - ${data.message}`)
          }
        }
      } catch (error) {
        console.error(`❌ Error migrating ${course.courseTitle}:`, error)
      }
    }
    
    console.log(`\n✅ Auto-migration complete!`)
    console.log(`   📊 Migrated: ${successCount}`)
    console.log(`   ⏭️ Skipped: ${skipCount}`)
    
    // Mark migration as completed
    localStorage.setItem('mongoDBMigrationCompleted', 'true')
    migrationCompleted = true
    
    // Show success notification
    if (successCount > 0) {
      const toast = document.createElement('div')
      toast.className = 'fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-2xl text-white font-medium z-50 animate-fade-in-up bg-gradient-to-r from-green-500 to-emerald-600 max-w-md'
      toast.innerHTML = `
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="font-semibold mb-1">Migration Complete! 🎉</p>
            <p class="text-sm">${successCount} courses migrated to MongoDB</p>
          </div>
        </div>
      `
      document.body.appendChild(toast)
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 5000)
    }
    
  } catch (error) {
    console.error('❌ Auto-migration failed:', error)
  } finally {
    migrationRunning = false
  }
}

