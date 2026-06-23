// Migration script to upload dummy courses from assets.js to MongoDB
import { dummyCourses } from '../assets/assets'

export const migrateDummyCoursesToMongoDB = async (getToken) => {
  console.log('🚀 Starting dummy courses migration to MongoDB...')
  
  try {
    const token = await getToken()
    if (!token) {
      console.error('❌ No auth token available')
      return { success: false, message: 'No auth token' }
    }

    console.log('✅ Got auth token')

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const course of dummyCourses) {
      try {
        // Prepare course data for MongoDB
        const courseData = {
          courseTitle: course.courseTitle,
          courseDescription: course.courseDescription,
          courseCategory: course.courseCategory || 'Programming',
          coursePrice: course.coursePrice,
          discount: course.discount || 0,
          courseThumbnail: course.courseThumbnail,
          courseContent: course.courseContent,
          courseLevel: course.courseLevel || 'Beginner',
          courseLanguage: course.courseLanguage || 'English'
        }

        console.log(`📤 Uploading: ${course.courseTitle}...`)

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/educator/add-course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(courseData)
        })

        const data = await response.json()
        
        console.log(`Response for ${course.courseTitle}:`, data)

        if (data.success) {
          successCount++
          console.log(`✅ Uploaded: ${course.courseTitle}`)
        } else {
          // If course already exists, that's OK
          if (data.message && data.message.includes('already exists')) {
            skipCount++
            console.log(`⏭️ Skipped (exists): ${course.courseTitle}`)
          } else {
            errorCount++
            console.warn(`⚠️ Failed: ${course.courseTitle} - ${data.message}`)
          }
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Error uploading ${course.courseTitle}:`, error)
      }
    }

    console.log(`\n✅ Migration complete!`)
    console.log(`   📊 Uploaded: ${successCount}`)
    console.log(`   ⏭️ Skipped: ${skipCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)

    return {
      success: true,
      uploaded: successCount,
      skipped: skipCount,
      errors: errorCount
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return { success: false, message: error.message }
  }
}
