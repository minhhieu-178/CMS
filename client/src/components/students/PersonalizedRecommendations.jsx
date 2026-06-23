import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { getAllUserAnalytics } from '../../utils/api';
import toast from 'react-hot-toast';

const PersonalizedRecommendations = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [userLevel, setUserLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadRecommendations = async () => {
    try {
      const token = await getToken();
      
      // Get user's analytics first
      const analytics = await getAllUserAnalytics(token);
      
      if (!analytics.success || analytics.analytics.length === 0) {
        // No analytics yet, show popular courses instead
        await loadPopularCourses(token);
        return;
      }

      // Get recommendations from the first course's analytics
      const firstCourse = analytics.analytics[0];
      if (firstCourse.recommendations?.suggestedCourses?.length > 0) {
        setRecommendations(firstCourse.recommendations.suggestedCourses.slice(0, 3)); // Show top 3
        setUserLevel(firstCourse.learningPattern.learningLevel);
        setFallbackMode(false);
      } else {
        // No recommendations generated yet, show popular courses
        await loadPopularCourses(token);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback to popular courses on error
      try {
        const token = await getToken();
        await loadPopularCourses(token);
      } catch (fallbackError) {
        console.error('Error loading popular courses:', fallbackError);
        toast.error('Failed to load course recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPopularCourses = async (token) => {
    try {
      // Fetch all published courses and pick top ones
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/all-courses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.courses.length > 0) {
        // Sort by number of enrolled students and ratings
        const sorted = data.courses
          .filter(c => c.isPublished)
          .sort((a, b) => {
            const aScore = (a.enrolledStudents?.length || 0) * 0.7 + 
                          (a.courseRatings?.length || 0) * 0.3;
            const bScore = (b.enrolledStudents?.length || 0) * 0.7 + 
                          (b.courseRatings?.length || 0) * 0.3;
            return bScore - aScore;
          });
        
        setRecommendations(sorted.slice(0, 3));
        setFallbackMode(true);
        setUserLevel('beginner'); // Default level
      }
    } catch (error) {
      console.error('Error loading popular courses:', error);
      throw error;
    }
  };

  // Don't show if no recommendations or not logged in
  if (!user || loading || recommendations.length === 0) {
    return null;
  }

  const getLevelMessage = () => {
    if (fallbackMode) {
      return '🌟 Khám phá các khóa học phổ biến nhất! Bắt đầu học để nhận gợi ý cá nhân hóa.';
    }
    
    switch (userLevel) {
      case 'beginner':
        return ' You are at a beginner level. These courses are perfect for strengthening your foundation.!';
      case 'intermediate':
        return ' You are learning very well! These courses will help you improve your skills. ' ;
      case 'advanced':
        return ' Excellent! Challenge yourself with these advanced courses.';
      default:
        return ' Based on your academic performance, we suggest these courses.';
    }
  };

  const getHeaderTitle = () => {
    return fallbackMode ? 'Khóa học phổ biến' : 'Recommend for you';
  };

  return (
    <div className='w-full px-8 md:px-36 py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md mb-4'>
            <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
            </svg>
            <span className='text-sm font-semibold text-purple-600'>Personalized for You</span>
          </div>
          
          <h2 className='text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3'>
            {getHeaderTitle()}
          </h2>
          
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            {getLevelMessage()}
          </p>
        </div>

        {/* Recommendations Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {recommendations.map((course, index) => (
            <div 
              key={course._id}
              className='bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group transform hover:-translate-y-2'
              onClick={() => navigate(`/course/${course._id}`)}
            >
              {/* Badge */}
              <div className='relative'>
                <img 
                  src={course.courseThumbnail || 'https://via.placeholder.com/400x250'}
                  alt={course.courseTitle}
                  className='w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300'
                />
                <div className='absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg'>
                  {fallbackMode ? `Phổ biến #${index + 1}` : `#${index + 1} Gợi ý`}
                </div>
                <div className='absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg'>
                  <span className='text-sm font-bold text-gray-900'>
                    ${course.coursePrice}
                  </span>
                </div>
              </div>
              
              <div className='p-6'>
                <h3 className='font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors'>
                  {course.courseTitle}
                </h3>
                
                <p className='text-sm text-gray-600 mb-4 line-clamp-3'>
                  {course.courseDescription ? course.courseDescription.replace(/<[^>]*>/g, '').substring(0, 120) : 'No description available'}...
                </p>
                
                <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
                  <div className='flex items-center gap-2'>
                    <svg className='w-5 h-5 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                    </svg>
                    <span className='text-sm font-semibold text-gray-700'>
                      {course.courseRatings?.length > 0 
                        ? (course.courseRatings.reduce((sum, r) => sum + r.rating, 0) / course.courseRatings.length).toFixed(1)
                        : '5.0'
                      }
                    </span>
                    <span className='text-xs text-gray-500'>
                      ({course.courseRatings?.length || 0})
                    </span>
                  </div>
                  
                  <button className='bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-md'>
                    View Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className='text-center mt-12'>
          <button 
            onClick={() => navigate('/learning-analytics')}
            className='inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-xl transition-all border-2 border-purple-200 hover:border-purple-400'
          >
            <span>Xem phân tích học tập chi tiết</span>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
