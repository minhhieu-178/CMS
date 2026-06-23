import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getUserProfile, becomeEducator as becomeEducatorAPI, getEnrolledCourses } from "../utils/api";


export const AppContext = createContext()

export const AppContextProvider = (props) => {

    const currency = import.meta.env.VITE_CURRENCY
    const navigate = useNavigate()

    const {getToken} = useAuth()
    const {user} = useUser()
 
    const [allCourses, setAllCourses] = useState([])
    const [isEducator, setIsEducator] = useState(false)
    const [enrolledCourses, setEnrolledCourses] = useState([])
    const [userRole, setUserRole] = useState('student')
    const [educatorCourses, setEducatorCourses] = useState([])

    // Fetch user profile and role
    const fetchUserProfile = async () => {
        try {
            const token = await getToken()
            if (!token) {
                console.log('No token available yet')
                return
            }
            
            // Check if admin has updated this user's role in localStorage
            const allUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]')
            const userInStorage = allUsers.find(u => u.id === user?.id)
            
            // LocalStorage is the source of truth for roles
            if (userInStorage && user) {
                const storageRole = userInStorage.role
                const currentClerkRole = user.unsafeMetadata?.role || user.publicMetadata?.role || 'student'
                
                console.log('🔍 Role check:', { storageRole, currentClerkRole, userId: user.id })
                
                // Always use LocalStorage role as source of truth
                setUserRole(storageRole)
                setIsEducator(storageRole === 'educator' || storageRole === 'admin')
                
                // Try to sync to Clerk if different (but don't fail if it doesn't work)
                if (currentClerkRole !== storageRole) {
                    console.log(`🔄 Syncing role to Clerk: ${storageRole}`)
                    try {
                        await user.update({
                            unsafeMetadata: {
                                ...user.unsafeMetadata,
                                role: storageRole
                            }
                        })
                        await user.reload()
                        console.log('✅ Clerk role synced to:', storageRole)
                    } catch (error) {
                        console.warn('⚠️ Could not sync to Clerk (this is OK, using LocalStorage):', error.message)
                    }
                }
                
                return // Exit early, we've set the role from LocalStorage
            }
            
            // Save user info to localStorage for admin tracking
            if (user) {
                const existingUserIndex = allUsers.findIndex(u => u.id === user.id)
                
                const userData = {
                    id: user.id,
                    email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress,
                    name: user.fullName || user.firstName || user.username,
                    imageUrl: user.imageUrl,
                    createdAt: user.createdAt,
                    lastLogin: new Date().toISOString(),
                    role: user.unsafeMetadata?.role || user.publicMetadata?.role || 'student'
                }
                
                if (existingUserIndex >= 0) {
                    // Update existing user, but PRESERVE role if it was set by admin
                    const existingRole = allUsers[existingUserIndex].role
                    if (existingRole && existingRole !== 'student') {
                        // Admin has set a role, keep it
                        userData.role = existingRole
                        console.log('📌 Preserving admin-set role:', existingRole)
                    }
                    allUsers[existingUserIndex] = userData
                } else {
                    // Add new user
                    allUsers.push(userData)
                }
                
                localStorage.setItem('allRegisteredUsers', JSON.stringify(allUsers))
                
                // Use the preserved/updated role
                setUserRole(userData.role)
                setIsEducator(userData.role === 'educator' || userData.role === 'admin')
            }
            
            const result = await getUserProfile(token)
            if (result.success) {
                setUserRole(result.user.role)
                setIsEducator(result.user.role === 'educator')
            } else {
                // Use role from LocalStorage as source of truth
                const role = userInStorage?.role || user?.unsafeMetadata?.role || user?.publicMetadata?.role || 'student'
                setUserRole(role)
                setIsEducator(role === 'educator')
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            // Use role from LocalStorage as fallback
            const allUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]')
            const userInStorage = allUsers.find(u => u.id === user?.id)
            const role = userInStorage?.role || user?.unsafeMetadata?.role || user?.publicMetadata?.role || 'student'
            setUserRole(role)
            setIsEducator(role === 'educator')
        }
    }

    // Become educator
    const becomeEducator = async () => {
        try {
            const token = await getToken()
            if (!token) {
                return { success: false, message: 'Not authenticated' }
            }
            const result = await becomeEducatorAPI(token)
            if (result.success) {
                // Immediately update local state
                setUserRole('educator')
                setIsEducator(true)
                
                // Re-fetch profile to ensure sync
                await fetchUserProfile()
                
                // Navigate to educator dashboard
                setTimeout(() => {
                    navigate('/educator')
                }, 100)
                
                return { success: true, message: result.message }
            }
            return { success: false, message: result.message }
        } catch (error) {
            console.error('Error becoming educator:', error)
            return { success: false, message: 'Failed to become educator' }
        }
    }

    // Fetch All Courses (from MongoDB API + LocalStorage)
    const fetchAllCourses = async () => {
        let allEducatorCourses = []
        
        // 1. Try to fetch from MongoDB API first
        try {
            const response = await fetch('http://localhost:5000/api/student/courses')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.courses) {
                    allEducatorCourses = data.courses
                    console.log('☁️ Loaded from MongoDB API:', allEducatorCourses.length)
                    
                    // Save to LocalStorage for offline access
                    localStorage.setItem('globalCourses', JSON.stringify(data.courses))
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch from MongoDB API, using LocalStorage:', error.message)
        }
        
        // 2. If API failed, fallback to LocalStorage
        if (allEducatorCourses.length === 0) {
            try {
                const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]')
                if (globalCourses.length > 0) {
                    allEducatorCourses = [...globalCourses]
                    console.log('💾 Loaded from LocalStorage globalCourses:', globalCourses.length)
                }
            } catch (error) {
                console.error('Error loading globalCourses:', error)
            }
            
            // Also check user-specific courses
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                
                if (key && key.startsWith('educatorCourses_')) {
                    try {
                        const courses = JSON.parse(localStorage.getItem(key))
                        
                        if (Array.isArray(courses)) {
                            // Add courses that don't exist yet (check by _id)
                            const existingIds = new Set(allEducatorCourses.map(c => c._id))
                            courses.forEach(course => {
                                if (!existingIds.has(course._id)) {
                                    allEducatorCourses.push(course)
                                    existingIds.add(course._id)
                                }
                            })
                        }
                    } catch (error) {
                        console.error(`Error loading ${key}:`, error)
                    }
                }
            }
        }
        
        console.log('📚 Total educator courses:', allEducatorCourses.length)
        
        // Add educator names to dummy courses if they don't have them
        const dummyCoursesWithEducators = dummyCourses.map(course => {
            if (typeof course.educator === 'string') {
                const educatorNames = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Jessica Martinez']
                const randomName = educatorNames[Math.floor(Math.random() * educatorNames.length)]
                
                return {
                    ...course,
                    educator: {
                        _id: course.educator,
                        name: randomName,
                        email: `${randomName.toLowerCase().replace(' ', '.')}@example.com`
                    }
                }
            }
            return course
        })
        
        const combined = [...dummyCoursesWithEducators, ...allEducatorCourses]
        console.log('✅ Total courses loaded:', combined.length)
        setAllCourses(combined)
    }

    // Search courses (search in all available courses)
    const searchCourses = async (searchTerm) => {
        try {
            console.log('Searching for:', searchTerm)
            console.log('Searching in allCourses:', allCourses.length)
            
            if (!searchTerm || searchTerm.trim() === '') {
                return allCourses
            }
            
            const searchLower = searchTerm.toLowerCase()
            
            // Search in course title, description, and educator name
            const results = allCourses.filter(course => {
                const titleMatch = course.courseTitle?.toLowerCase().includes(searchLower)
                const descMatch = course.courseDescription?.toLowerCase().includes(searchLower)
                
                // Check educator name (handle both string and object)
                let educatorMatch = false
                if (typeof course.educator === 'string') {
                    educatorMatch = course.educator.toLowerCase().includes(searchLower)
                } else if (course.educator?.name) {
                    educatorMatch = course.educator.name.toLowerCase().includes(searchLower)
                }
                
                return titleMatch || descMatch || educatorMatch
            })
            
            console.log('Search results:', results.length)
            return results
        } catch (error) {
            console.error('Error searching courses:', error)
            return []
        }
    }

    // Calculate Rating
    const calculateRating = (course)=>{
        if(course.courseRatings.length === 0){
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach(rating =>{
            totalRating += rating.rating
        })
        return totalRating / course.courseRatings.length
    }

    // Calculate Course Chapter time
    const calculateChapterTime = (chapter)=>{
        let time = 0
        chapter.chapterContent.map((lecture)=> time += lecture.lectureDuration)
        return humanizeDuration(time * 60 * 1000, {units: ["h", "m"]})
    }

    // Calculate Course Duration
    const calculateCourseDuration = (course)=>{
        let time = 0
        course.courseContent.map((chapter)=> chapter.chapterContent.map(
            (lecture)=> time += lecture.lectureDuration
        ))
        return humanizeDuration(time * 60 * 1000, {units: ["h", "m"]})
    }

    // Calculate No of lecture in the course
    const calculateNoOfLectures = (course)=>{
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if(Array.isArray(chapter.chapterContent)){
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }

    // Fetch User Enrolled Courses from MongoDB
    const fetchUserEnrolledCourses = async ()=>{
        try {
            if (!user?.id) {
                console.log('❌ No user ID, clearing enrollments')
                setEnrolledCourses([])
                return
            }
            
            // Load from MongoDB API
            const token = await getToken()
            const result = await getEnrolledCourses(token)
            
            console.log('🔍 Fetching enrollments from MongoDB for user:', user.id)
            console.log('📦 API result:', result)
            
            if (result.success && result.enrollments) {
                console.log('✅ Loaded enrollments from MongoDB:', result.enrollments.length)
                
                // Extract courses from enrollments
                const enrolledCoursesData = result.enrollments
                    .map(enrollment => enrollment.courseId)
                    .filter(course => course != null) // Filter out null courses
                
                console.log('📚 Enrolled courses found:', enrolledCoursesData.length)
                setEnrolledCourses(enrolledCoursesData)
            } else {
                console.log('📦 No enrollments found in MongoDB')
                setEnrolledCourses([])
            }
        } catch (error) {
            console.error('Error loading enrollments from MongoDB:', error)
            setEnrolledCourses([])
        }
    }

    // Add new course (educator) - Save to LocalStorage
    const addNewCourse = async (courseData) => {
        if (!user?.id) {
            console.error('No user ID available')
            return null
        }
        
        try {
            // Save to LocalStorage
            const storageKey = `educatorCourses_${user.id}`
            const existingCourses = JSON.parse(localStorage.getItem(storageKey) || '[]')
            
            // Add educator info
            const newCourse = {
                ...courseData,
                _id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                educator: {
                    _id: user.id,
                    name: user.fullName || user.firstName || user.username,
                    email: user.primaryEmailAddress?.emailAddress
                },
                createAt: new Date().toISOString(),
                enrolledStudents: []
            }
            
            // Save to user-specific courses
            const updatedCourses = [...existingCourses, newCourse]
            localStorage.setItem(storageKey, JSON.stringify(updatedCourses))
            
            // Also save to globalCourses for public display
            const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]')
            globalCourses.push(newCourse)
            localStorage.setItem('globalCourses', JSON.stringify(globalCourses))
            
            console.log('✅ Course added to LocalStorage:', newCourse._id)
            
            // Update local state
            setEducatorCourses(updatedCourses)
            
            // Reload all courses
            await fetchAllCourses()
            
            return newCourse
        } catch (error) {
            console.error('Error adding course to LocalStorage:', error)
            return null
        }
    }

    useEffect(() => {
        fetchAllCourses()
    }, [])

    // Reload enrolled courses when allCourses or user changes
    useEffect(() => {
        if (allCourses.length > 0 && user?.id) {
            console.log('🔄 Reloading enrollments because allCourses or user changed')
            fetchUserEnrolledCourses()
        }
    }, [allCourses, user?.id])

    // Reload courses when educator courses change
    useEffect(() => {
        fetchAllCourses()
    }, [educatorCourses])

    // Listen for course updates from other components
    useEffect(() => {
        const handleCoursesUpdated = () => {
            console.log('Courses updated event received, reloading...')
            fetchAllCourses()
        }
        
        const handleEnrollmentsUpdated = () => {
            console.log('Enrollments updated event received, reloading...')
            // Only reload if user is available and courses are loaded
            if (user?.id && allCourses.length > 0) {
                fetchUserEnrolledCourses()
            } else {
                console.log('⚠️ User or courses not ready yet, will reload when ready')
            }
        }
        
        window.addEventListener('coursesUpdated', handleCoursesUpdated)
        window.addEventListener('enrollmentsUpdated', handleEnrollmentsUpdated)
        
        return () => {
            window.removeEventListener('coursesUpdated', handleCoursesUpdated)
            window.removeEventListener('enrollmentsUpdated', handleEnrollmentsUpdated)
        }
    }, [allCourses, user?.id])

    useEffect(()=>{
        if(user){
            fetchUserProfile()
            
            // Listen for role updates from admin
            const handleRoleUpdated = () => {
                console.log('🔔 Role update detected, reloading profile...')
                fetchUserProfile()
            }
            
            window.addEventListener('userRoleUpdated', handleRoleUpdated)
            
            // Check for notifications on mount
            const checkNotifications = () => {
                const notifications = JSON.parse(localStorage.getItem('userNotifications') || '{}')
                const userNotification = notifications[user.id]
                
                if (userNotification && !userNotification.read && userNotification.type === 'educator_approved') {
                    // Mark as read
                    notifications[user.id].read = true
                    localStorage.setItem('userNotifications', JSON.stringify(notifications))
                    
                    // Show notification and reload
                    const toast = document.createElement('div')
                    toast.className = 'fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl text-white font-medium z-50 animate-fade-in-right bg-gradient-to-r from-green-500 to-emerald-600 max-w-md'
                    toast.innerHTML = `
                        <div class="flex items-start gap-3">
                            <svg class="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p class="font-semibold mb-1">Chúc mừng! 🎉</p>
                                <p class="text-sm">${userNotification.message}</p>
                            </div>
                        </div>
                    `
                    document.body.appendChild(toast)
                    
                    // Reload after 2 seconds
                    setTimeout(() => {
                        window.location.reload()
                    }, 2000)
                }
            }
            
            checkNotifications()
            
            return () => {
                window.removeEventListener('userRoleUpdated', handleRoleUpdated)
            }
        }
    }, [user])

    const value = {
        currency,
        allCourses,
        navigate,
        calculateRating,
        isEducator,
        setIsEducator,
        userRole,
        becomeEducator,
        fetchUserProfile,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        enrolledCourses,
        fetchUserEnrolledCourses,
        educatorCourses,
        addNewCourse,
        searchCourses
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}
