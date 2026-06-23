import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import PersonalizedDashboard from '../../components/students/PersonalizedDashboard';

const MyProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
              My Learning Progress
            </h1>
            <p className='text-gray-600'>Track your personalized learning journey</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className='bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 font-medium transition-colors flex items-center gap-2'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
            </svg>
            Back
          </button>
        </div>

        {/* Personalized Dashboard */}
        {courseId ? (
          <PersonalizedDashboard courseId={courseId} />
        ) : (
          <div className='bg-white rounded-xl shadow-lg p-8 text-center'>
            <svg className='w-16 h-16 text-gray-300 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>No Course Selected</h3>
            <p className='text-gray-600 mb-6'>Please select a course to view your progress</p>
            <button
              onClick={() => navigate('/my-enrollments')}
              className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg'
            >
              View My Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProgress;
