import { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { addRating, getCourseRatings, updateRating } from '../../utils/api'
import toast from 'react-hot-toast'

const Rating = ({initialRating, onRate, courseId}) => {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [rating, setRating] = useState(initialRating || 0)
  const [userRating, setUserRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  // Load user's rating from MongoDB
  useEffect(() => {
    if (courseId && user) {
      loadUserRating()
    }
  }, [courseId, user])

  const loadUserRating = async () => {
    try {
      const result = await getCourseRatings(courseId)
      if (result.success && result.ratings) {
        const myRating = result.ratings.find(r => r.userId === user.id)
        if (myRating) {
          setRating(myRating.rating)
          setUserRating(myRating.rating)
        }
      }
    } catch (error) {
      console.error('Error loading rating:', error)
    }
  }

  const handleRating = async (value) => {
    if (!user) {
      toast.error('Please sign in to rate this course')
      return
    }

    if (!courseId) {
      toast.error('Course ID is required')
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      
      let result
      if (userRating > 0) {
        // Update existing rating
        result = await updateRating(token, courseId, value)
      } else {
        // Add new rating
        result = await addRating(token, courseId, value)
      }

      if (result.success) {
        setRating(value)
        setUserRating(value)
        toast.success(userRating > 0 ? 'Rating updated!' : 'Rating submitted!')
        
        // Call parent callback if provided
        if (onRate) {
          onRate(value)
        }
      } else {
        toast.error(result.message || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <div className='flex'>
        {Array.from({length: 5}, (_,index)=>{
          const starValue = index + 1;
          const isActive = starValue <= (hoveredStar || rating)
          
          return(
            <span 
              key={index} 
              className={`text-xl sm:text-2xl cursor-pointer transition-all transform hover:scale-110 ${
                isActive ? 'text-yellow-500' : 'text-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !loading && handleRating(starValue)}
              onMouseEnter={() => !loading && setHoveredStar(starValue)}
              onMouseLeave={() => !loading && setHoveredStar(0)}
            >
              &#9733;
            </span>
          )
        })}
      </div>
      {userRating > 0 && (
        <span className='text-sm text-gray-600'>
          (Your rating: {userRating}/5)
        </span>
      )}
    </div>
  )
}

export default Rating