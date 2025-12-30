import React, { useEffect, useState } from 'react'

const Rating = ({initialRating, onRate, courseId}) => {

  const [rating, setRating] = useState(initialRating || 0)

  // Load rating from localStorage on mount
  useEffect(() => {
    if (courseId) {
      const savedRating = localStorage.getItem(`rating_${courseId}`)
      if (savedRating) {
        setRating(Number(savedRating))
      } else if (initialRating) {
        setRating(initialRating)
      }
    } else if (initialRating) {
      setRating(initialRating)
    }
  }, [initialRating, courseId])

  const handleRating = (value) => {
    setRating(value)
    
    // Save to localStorage if courseId is provided
    if (courseId) {
      localStorage.setItem(`rating_${courseId}`, value.toString())
    }
    
    // Call parent callback if provided
    if (onRate) {
      onRate(value)
    }
  }

  return (
    <div>
        {Array.from({length: 5}, (_,index)=>{
          const starValue = index + 1;
          return(
            <span key={index} className={`text-xl sm:text-2xl cursor-pointer transition-colors ${starValue <= 
            rating ? 'text-yellow-500' : 'text-gray-400'}`}
            onClick={()=> handleRating(starValue)}>
              &#9733;
            </span>
          )
        })}
    </div>
  )
}

export default Rating