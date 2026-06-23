import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import ImprovedLoading from '../../components/students/ImprovedLoading';
import { getAllUserAnalytics, getCourseRecommendations } from '../../utils/api';
import toast from 'react-hot-toast';

const LearningAnalytics = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Sync pending completions from localStorage to MongoDB
  const syncPendingCompletions = async (token) => {
    try {
      // Get all enrolled courses
      const enrollmentsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/enrollment/my-enrollments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrollmentsData = await enrollmentsRes.json();
      
      if (!enrollmentsData.success || !enrollmentsData.enrollments) return;
      
      // For each enrolled course, check if localStorage has more completed lectures than MongoDB
      for (const enrollment of enrollmentsData.enrollments) {
        const courseId = enrollment.courseId._id;
        const storageKey = `completedLectures_${courseId}`;
        const localData = localStorage.getItem(storageKey);
        
        if (!localData) continue;
        
        const localCompleted = JSON.parse(localData);
        const mongoCompleted = enrollment.progress?.lecturesCompleted || [];
        
        // If localStorage has more items, sync the missing ones
        if (localCompleted.length > mongoCompleted.length) {
          console.log(`🔄 Syncing ${localCompleted.length - mongoCompleted.length} pending lectures for course ${courseId}`);
          
          const course = enrollment.courseId;
          
          // Sync each completed lecture
          for (const item of localCompleted) {
            const chapter = course.courseContent[item.chapter];
            const lecture = chapter?.chapterContent[item.lecture];
            
            if (chapter && lecture) {
              await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/personalization/progress`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  courseId: courseId,
                  lectureId: lecture.lectureId,
                  chapterId: chapter.chapterId
                })
              });
            }
          }
          
          console.log(`✅ Synced pending lectures for course ${courseId}`);
        }
      }
    } catch (error) {
      console.error('⚠️ Error syncing pending completions:', error);
      // Don't throw - continue loading analytics even if sync fails
    }
  };

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('❌ No user found');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Loading analytics for user:', user.id);
      
      const token = await getToken();
      
      // First, try to sync any pending completions from localStorage
      await syncPendingCompletions(token);
      
      const result = await getAllUserAnalytics(token);
      
      console.log('📊 Analytics result:', result);
      
      if (result.success) {
        setSummary(result.summary);
        
        // Transform analytics data to match the UI format
        const transformedAnalytics = result.analytics.map(item => ({
          courseId: item.courseId._id,
          courseTitle: item.courseId.courseTitle,
          courseThumbnail: item.courseId.courseThumbnail,
          learningLevel: item.learningPattern.learningLevel,
          progress: {
            percentage: item.progress.overallProgress,
            completedLectures: item.progress.completedLectures.length
          },
          quizPerformance: {
            averageScore: item.learningPattern.averageQuizScore,
            totalQuizzes: item.learningPattern.totalQuizzesTaken
          },
          lastAccessed: item.progress.lastAccessedDate
        }));
        
        setAnalytics(transformedAnalytics);
        console.log('✅ Analytics loaded - Summary:', result.summary);
        console.log('✅ Analytics loaded - Courses:', transformedAnalytics);
        
        // Log detailed progress for each course
        transformedAnalytics.forEach((course, index) => {
          console.log(`📊 Course ${index + 1}: ${course.courseTitle}`);
          console.log(`   Progress: ${course.progress.percentage}%`);
          console.log(`   Completed Lectures: ${course.progress.completedLectures}`);
          console.log(`   Quiz Performance: ${course.quizPerformance.averageScore}% (${course.quizPerformance.totalQuizzes} quizzes)`);
          console.log(`   Learning Level: ${course.learningLevel}`);
        });
        
        // Load recommendations based on the first enrolled course
        if (result.analytics.length > 0 && result.analytics[0].recommendations.suggestedCourses.length > 0) {
          const recommendedCourses = result.analytics[0].recommendations.suggestedCourses;
          setRecommendations(recommendedCourses);
          console.log('✅ Recommendations loaded:', recommendedCourses.length);
        }
      } else {
        console.error('❌ Failed to load analytics:', result.message);
        toast.error(result.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: 'bg-blue-100 text-blue-700',
      intermediate: 'bg-purple-100 text-purple-700',
      advanced: 'bg-green-100 text-green-700'
    };
    return colors[level] || colors.beginner;
  };

  if (loading) {
    return <ImprovedLoading />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
            Learning Analytics
          </h1>
          <p className='text-gray-600'>Track your learning progress and performance</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white rounded-xl shadow-lg p-6 border border-blue-100'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                  </svg>
                </div>
                <span className='text-sm text-gray-600 font-medium'>Total Courses</span>
              </div>
              <p className='text-3xl font-bold text-gray-900'>{summary.totalCourses}</p>
            </div>

            <div className='bg-white rounded-xl shadow-lg p-6 border border-purple-100'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <svg className='w-5 h-5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                  </svg>
                </div>
                <span className='text-sm text-gray-600 font-medium'>Total Quizzes</span>
              </div>
              <p className='text-3xl font-bold text-gray-900'>{summary.totalQuizzes}</p>
            </div>

            <div className='bg-white rounded-xl shadow-lg p-6 border border-green-100'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                  <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
                  </svg>
                </div>
                <span className='text-sm text-gray-600 font-medium'>Average Score</span>
              </div>
              <p className='text-3xl font-bold text-gray-900'>{summary.averageScore}%</p>
            </div>

            <div className='bg-white rounded-xl shadow-lg p-6 border border-orange-100'>
              <div className='flex items-center gap-3 mb-2'>
                <div className='w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center'>
                  <svg className='w-5 h-5 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                  </svg>
                </div>
                <span className='text-sm text-gray-600 font-medium'>Avg Progress</span>
              </div>
              <p className='text-3xl font-bold text-gray-900'>{summary.averageProgress}%</p>
            </div>
          </div>
        )}

        {/* Course Analytics */}
        <div className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>Course Performance</h2>
          
          {analytics.length === 0 ? (
            <div className='text-center py-12'>
              <svg className='w-16 h-16 text-gray-300 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              <p className='text-gray-500'>No learning data yet. Start learning to see your analytics!</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {analytics.map((item) => (
                <div 
                  key={item.courseId}
                  className='border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={() => navigate(`/player/${item.courseId}`)}
                >
                  <div className='flex items-start gap-4'>
                    <img 
                      src={item.courseThumbnail || 'https://via.placeholder.com/100'}
                      alt={item.courseTitle}
                      className='w-24 h-24 rounded-lg object-cover'
                    />
                    
                    <div className='flex-1'>
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <h3 className='text-lg font-bold text-gray-900 mb-1'>
                            {item.courseTitle}
                          </h3>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(item.learningLevel)}`}>
                            {item.learningLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className='text-right'>
                          <p className='text-2xl font-bold text-blue-600'>
                            {Math.round(item.quizPerformance.averageScore)}%
                          </p>
                          <p className='text-xs text-gray-500'>Average Score</p>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-3'>
                        <div>
                          <p className='text-xs text-gray-600 mb-1'>Progress</p>
                          <div className='flex items-center gap-2'>
                            <div className='flex-1 bg-gray-200 rounded-full h-2'>
                              <div 
                                className='bg-blue-600 h-2 rounded-full'
                                style={{ width: `${item.progress.percentage}%` }}
                              ></div>
                            </div>
                            <span className='text-sm font-bold text-gray-900'>
                              {item.progress.percentage}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className='text-xs text-gray-600 mb-1'>Quizzes Taken</p>
                          <p className='text-lg font-bold text-gray-900'>
                            {item.quizPerformance.totalQuizzes}
                          </p>
                        </div>

                        <div>
                          <p className='text-xs text-gray-600 mb-1'>Lectures Completed</p>
                          <p className='text-lg font-bold text-gray-900'>
                            {item.progress.completedLectures}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <p className='text-xs text-gray-500'>
                          Last accessed: {new Date(item.lastAccessed).toLocaleDateString()}
                        </p>
                        <button className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
                          Continue Learning
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Courses Section */}
        {recommendations.length > 0 && (
          <div className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-8'>
            <div className='flex items-center gap-3 mb-6'>
              <svg className='w-8 h-8 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
              </svg>
              <h2 className='text-2xl font-bold text-gray-900'>Recommended Courses for You</h2>
            </div>
            
            <p className='text-gray-600 mb-6'>
              Based on your learning progress, we recommend these courses that match your current level
            </p>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {recommendations.map((course) => (
                <div 
                  key={course._id}
                  className='border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group'
                  onClick={() => navigate(`/course/${course._id}`)}
                >
                  <div className='relative'>
                    <img 
                      src={course.courseThumbnail || 'https://via.placeholder.com/300x200'}
                      alt={course.courseTitle}
                      className='w-full h-48 object-cover group-hover:scale-105 transition-transform'
                    />
                    <div className='absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-lg'>
                      <span className='text-sm font-bold text-purple-600'>
                        ${course.coursePrice || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className='p-4'>
                    <h3 className='font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors'>
                      {course.courseTitle}
                    </h3>
                    
                    {course.courseDescription && (
                      <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                        {course.courseDescription.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                    )}
                    
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-1'>
                        <svg className='w-4 h-4 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                          <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                        </svg>
                        <span className='text-sm font-medium text-gray-700'>
                          {course.courseRatings?.length > 0 
                            ? (course.courseRatings.reduce((sum, r) => sum + r.rating, 0) / course.courseRatings.length).toFixed(1)
                            : '5.0'
                          }
                        </span>
                      </div>
                      
                      <button className='bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors'>
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningAnalytics;
