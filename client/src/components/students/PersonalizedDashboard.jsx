import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import ImprovedLoading from './ImprovedLoading';
import { getPersonalizedDashboard, getCourseRecommendations } from '../../utils/api';
import toast from 'react-hot-toast';

const PersonalizedDashboard = ({ courseId }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (user && courseId) {
      loadDashboard();
    }
  }, [courseId, user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      if (!user || !courseId) {
        setLoading(false);
        return;
      }
      
      const token = await getToken();
      
      // Load dashboard data
      const dashboardResult = await getPersonalizedDashboard(token, courseId);
      if (dashboardResult.success) {
        setDashboard(dashboardResult.dashboard);
      } else {
        console.error('Failed to load dashboard:', dashboardResult.message);
      }
      
      // Load recommendations
      const recResult = await getCourseRecommendations(token, courseId);
      if (recResult.success) {
        setRecommendations(recResult.recommendedCourses || []);
      }
    } catch (error) {
      console.error('Error loading personalized dashboard:', error);
      toast.error('Failed to load personalized dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level) => {
    const badges = {
      beginner: { color: 'bg-blue-100 text-blue-700', text: 'Beginner' },
      intermediate: { color: 'bg-purple-100 text-purple-700', text: 'Intermediate' },
      advanced: { color: 'bg-green-100 text-green-700', text: 'Advanced' }
    };
    return badges[level] || badges.beginner;
  };

  if (loading) {
    return <ImprovedLoading />;
  }

  if (!dashboard) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>No learning data available yet. Start learning to see your progress!</p>
      </div>
    );
  }

  const levelBadge = getLevelBadge(dashboard.learningLevel);

  return (
    <div className='space-y-6'>
      {/* Header with Level */}
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold mb-2'>Your Learning Journey</h2>
            <p className='text-blue-100'>Keep up the great work!</p>
          </div>
          <div className={`${levelBadge.color} px-4 py-2 rounded-full font-bold`}>
            {levelBadge.text}
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {/* Course Progress */}
        <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Course Progress</p>
              <p className='text-2xl font-bold text-gray-900'>{dashboard.progress.percentage}%</p>
            </div>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div 
              className='bg-blue-600 h-2 rounded-full transition-all'
              style={{ width: `${dashboard.progress.percentage}%` }}
            ></div>
          </div>
          <p className='text-xs text-gray-500 mt-2'>
            {dashboard.progress.completedLectures} / {dashboard.progress.totalLectures} lectures completed
          </p>
        </div>

        {/* Quiz Performance */}
        <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
              </svg>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Average Score</p>
              <p className='text-2xl font-bold text-gray-900'>{dashboard.quizPerformance.averageScore}/10</p>
            </div>
          </div>
          <p className='text-xs text-gray-500'>
            {dashboard.quizPerformance.totalQuizzes} quizzes taken
            {dashboard.quizPerformance.retakeCount > 0 && 
              ` • ${dashboard.quizPerformance.retakeCount} retakes`
            }
          </p>
        </div>

        {/* Next Lesson */}
        <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm text-gray-600'>Next Lesson</p>
              {dashboard.nextLesson ? (
                <p className='text-sm font-semibold text-gray-900 line-clamp-2'>
                  {dashboard.nextLesson.title}
                </p>
              ) : (
                <p className='text-sm text-gray-500'>Start learning!</p>
              )}
            </div>
          </div>
          {dashboard.nextLesson && (
            <button
              onClick={() => navigate(`/player/${courseId}`)}
              className='w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors'
            >
              Continue Learning
            </button>
          )}
        </div>
      </div>

      {/* Recent Quiz Performance */}
      {dashboard.quizPerformance.recentAttempts && dashboard.quizPerformance.recentAttempts.length > 0 && (
        <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
          <h3 className='text-lg font-bold text-gray-900 mb-4'>Recent Quiz Performance</h3>
          <div className='space-y-2'>
            {dashboard.quizPerformance.recentAttempts.map((attempt, index) => {
              const percentage = parseFloat(attempt.percentage) || 0
              return (
              <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    percentage >= 8 ? 'bg-green-100 text-green-700' :
                    percentage >= 5 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {percentage.toFixed(1)}
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Score: {attempt.score}/{attempt.totalQuestions}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {new Date(attempt.attemptDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {percentage >= 8 ? (
                  <span className='text-green-600 text-sm font-medium'>Excellent!</span>
                ) : percentage >= 5 ? (
                  <span className='text-yellow-600 text-sm font-medium'>Good</span>
                ) : (
                  <span className='text-red-600 text-sm font-medium'>Need Review</span>
                )}
              </div>
            )})}
          </div>
        </div>
      )}


    </div>
  );
};

export default PersonalizedDashboard;
