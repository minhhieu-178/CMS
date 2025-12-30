import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const ImprovedCourseCard = ({ course }) => {
  const navigate = useNavigate()
  const { currency, calculateRating, calculateCourseDuration, calculateNoOfLectures } = useContext(AppContext)

  const rating = calculateRating(course)
  const duration = calculateCourseDuration(course)
  const lectures = calculateNoOfLectures(course)
  const finalPrice = course.coursePrice * (1 - course.discount / 100)
  
  // Default image if thumbnail is missing
  const thumbnailUrl = course.courseThumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'
  
  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'
  }

  return (
    <div
      onClick={() => navigate(`/course/${course._id}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden h-48 bg-gray-200">
        <img
          src={thumbnailUrl}
          alt={course.courseTitle}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Discount Badge */}
        {course.discount > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {course.discount}% OFF
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
          Programming
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <button className="w-full bg-white text-gray-900 font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors">
              View Details →
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-xl text-gray-900 min-h-[3.5rem] leading-snug group-hover:text-blue-600 transition-colors">
          {course.courseTitle}
        </h3>

        {/* Educator Name */}
        {course.educator && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">{typeof course.educator === 'string' ? 'Educator' : course.educator.name}</span>
          </div>
        )}

        {/* Description */}
        <p 
          className="text-sm text-gray-600 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: course.courseDescription }}
        />

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{lectures} lectures</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{duration}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
          <span className="text-sm text-gray-500">({course.courseRatings.length})</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3"></div>

        {/* Price & Enroll */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {currency}{finalPrice.toFixed(2)}
              </span>
              {course.discount > 0 && (
                <span className="text-sm text-gray-500 line-through">
                  {currency}{course.coursePrice}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {course.enrolledStudents.length} students enrolled
            </div>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
            Enroll
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImprovedCourseCard
