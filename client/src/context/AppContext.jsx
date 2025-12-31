import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import { getUserProfile, becomeEducator as becomeEducatorAPI, getAllCourses } from "../utils/api";


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

    // Load educator courses from localStorage on mount - user-specific
    useEffect(() => {
        if (user?.id) {
            const storageKey = `educatorCourses_${user.id}`
            const savedCourses = localStorage.getItem(storageKey)
            if (savedCourses) {
                try {
                    const courses = JSON.parse(savedCourses)
                    setEducatorCourses(courses)
                    console.log('Loaded educator courses for user:', user.id, courses.length)
                } catch (error) {
                    console.error('Error loading educator courses:', error)
                }
            } else {
                setEducatorCourses([])
            }
        }
    }, [user])

    // Fetch user profile and role
    const fetchUserProfile = async () => {
        try {
            const token = await getToken()
            if (!token) {
                console.log('No token available yet')
                return
            }
            const result = await getUserProfile(token)
            if (result.success) {
                setUserRole(result.user.role)
                setIsEducator(result.user.role === 'educator')
            } else {
                // User might not be synced yet, default to student
                console.log('User profile not found, defaulting to student')
                setUserRole('student')
                setIsEducator(false)
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            // Default to student on error
            setUserRole('student')
            setIsEducator(false)
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

    // Fetch All Courses (for students - use dummy courses + educator courses)
    const fetchAllCourses = async () => {
        // Get all educator courses from all users (for public display)
        let allEducatorCourses = []
        
        // Get all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('educatorCourses_')) {
                try {
                    const courses = JSON.parse(localStorage.getItem(key))
                    if (Array.isArray(courses)) {
                        allEducatorCourses = [...allEducatorCourses, ...courses]
                    }
                } catch (error) {
                    console.error('Error loading courses from key:', key, error)
                }
            }
        }
        
        console.log('Loaded educator courses from all users:', allEducatorCourses.length)
        
        // Add educator names to dummy courses if they don't have them
        const dummyCoursesWithEducators = dummyCourses.map(course => {
            if (typeof course.educator === 'string') {
                // Generate a random educator name for demo
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
        console.log('Total courses loaded:', combined.length)
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

    // Fetch User Enrolled Courses
    const fetchUserEnrolledCourses = async ()=>{
        try {
            // Get enrollments from localStorage
            const enrollments = JSON.parse(localStorage.getItem('myEnrollments') || '[]')
            console.log('My enrollments:', enrollments)
            
            if (enrollments.length === 0) {
                setEnrolledCourses([])
                return
            }
            
            // Get enrolled course IDs
            const enrolledCourseIds = enrollments.map(e => e.courseId)
            
            // Filter courses from allCourses that match enrolled IDs
            const enrolled = allCourses.filter(course => 
                enrolledCourseIds.includes(course._id)
            )
            
            console.log('Enrolled courses found:', enrolled.length)
            setEnrolledCourses(enrolled)
        } catch (error) {
            console.error('Error fetching enrolled courses:', error)
            setEnrolledCourses([])
        }
    }

    // Add new course (educator)
    const addNewCourse = (courseData) => {
        if (!user?.id) {
            console.error('No user ID available')
            return null
        }
        
        const newCourse = {
            _id: Date.now().toString(),
            ...courseData,
            educator: user?.id || 'educator_id',
            enrolledStudents: [],
            courseRatings: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0
        }
        
        const updatedCourses = [...educatorCourses, newCourse]
        setEducatorCourses(updatedCourses)
        
        // Save to localStorage - user-specific
        const storageKey = `educatorCourses_${user.id}`
        localStorage.setItem(storageKey, JSON.stringify(updatedCourses))
        
        // Reload all courses to include the new one
        fetchAllCourses()
        
        return newCourse
    }

    useEffect(() => {
        fetchAllCourses()
    }, [])

    // Reload enrolled courses when allCourses changes
    useEffect(() => {
        if (allCourses.length > 0) {
            fetchUserEnrolledCourses()
        }
    }, [allCourses])

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
            fetchUserEnrolledCourses()
        }
        
        window.addEventListener('coursesUpdated', handleCoursesUpdated)
        window.addEventListener('enrollmentsUpdated', handleEnrollmentsUpdated)
        
        return () => {
            window.removeEventListener('coursesUpdated', handleCoursesUpdated)
            window.removeEventListener('enrollmentsUpdated', handleEnrollmentsUpdated)
        }
    }, [allCourses])

    useEffect(()=>{
        if(user){
            fetchUserProfile()
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
