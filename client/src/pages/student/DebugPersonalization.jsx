import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { calculateLocalAnalytics } from '../../utils/localPersonalization';

const DebugPersonalization = () => {
  const { user } = useUser();
  const [result, setResult] = useState(null);

  const handleDebug = () => {
    if (!user) {
      alert('Please sign in first');
      return;
    }

    // Get all localStorage data
    const quizAttempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    const courses = JSON.parse(localStorage.getItem('globalCourses') || '[]');
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');

    // Filter user data
    const userAttempts = quizAttempts.filter(a => a.userId === user.id);
    const userEnrollments = enrollments.filter(e => e.studentId === user.id);

    // Calculate analytics
    const analytics = calculateLocalAnalytics(user.id);

    setResult({
      userId: user.id,
      rawData: {
        totalQuizAttempts: quizAttempts.length,
        userQuizAttempts: userAttempts.length,
        totalEnrollments: enrollments.length,
        userEnrollments: userEnrollments.length,
        totalCourses: courses.length,
        totalQuizzes: quizzes.length
      },
      userAttempts,
      userEnrollments,
      analytics
    });
  };

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
          <h1 className='text-3xl font-bold mb-4'>Debug Personalization</h1>
          <p className='text-gray-600 mb-4'>
            User ID: {user?.id || 'Not signed in'}
          </p>
          <button
            onClick={handleDebug}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700'
          >
            Run Debug
          </button>
        </div>

        {result && (
          <div className='space-y-6'>
            {/* Raw Data Summary */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold mb-4'>Raw Data Summary</h2>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                <div className='bg-blue-50 p-4 rounded'>
                  <p className='text-sm text-gray-600'>Total Quiz Attempts</p>
                  <p className='text-2xl font-bold'>{result.rawData.totalQuizAttempts}</p>
                </div>
                <div className='bg-green-50 p-4 rounded'>
                  <p className='text-sm text-gray-600'>Your Quiz Attempts</p>
                  <p className='text-2xl font-bold'>{result.rawData.userQuizAttempts}</p>
                </div>
                <div className='bg-purple-50 p-4 rounded'>
                  <p className='text-sm text-gray-600'>Your Enrollments</p>
                  <p className='text-2xl font-bold'>{result.rawData.userEnrollments}</p>
                </div>
                <div className='bg-yellow-50 p-4 rounded'>
                  <p className='text-sm text-gray-600'>Total Courses</p>
                  <p className='text-2xl font-bold'>{result.rawData.totalCourses}</p>
                </div>
                <div className='bg-red-50 p-4 rounded'>
                  <p className='text-sm text-gray-600'>Total Quizzes</p>
                  <p className='text-2xl font-bold'>{result.rawData.totalQuizzes}</p>
                </div>
              </div>
            </div>

            {/* Analytics Result */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold mb-4'>Analytics Result</h2>
              {result.analytics.success ? (
                <div>
                  <div className='bg-green-50 border border-green-200 rounded p-4 mb-4'>
                    <p className='text-green-800 font-medium'>✅ Analytics calculated successfully</p>
                  </div>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                    <div className='bg-gray-50 p-4 rounded'>
                      <p className='text-sm text-gray-600'>Total Courses</p>
                      <p className='text-2xl font-bold'>{result.analytics.summary.totalCourses}</p>
                    </div>
                    <div className='bg-gray-50 p-4 rounded'>
                      <p className='text-sm text-gray-600'>Total Quizzes</p>
                      <p className='text-2xl font-bold'>{result.analytics.summary.totalQuizzes}</p>
                    </div>
                    <div className='bg-gray-50 p-4 rounded'>
                      <p className='text-sm text-gray-600'>Average Score</p>
                      <p className='text-2xl font-bold'>{result.analytics.summary.averageScore}</p>
                    </div>
                    <div className='bg-gray-50 p-4 rounded'>
                      <p className='text-sm text-gray-600'>Average Progress</p>
                      <p className='text-2xl font-bold'>{result.analytics.summary.averageProgress}%</p>
                    </div>
                  </div>
                  <pre className='bg-gray-100 p-4 rounded overflow-auto text-xs'>
                    {JSON.stringify(result.analytics, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className='bg-red-50 border border-red-200 rounded p-4'>
                  <p className='text-red-800'>❌ {result.analytics.message}</p>
                </div>
              )}
            </div>

            {/* User Quiz Attempts */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold mb-4'>Your Quiz Attempts ({result.userAttempts.length})</h2>
              {result.userAttempts.length > 0 ? (
                <div className='overflow-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-gray-100'>
                      <tr>
                        <th className='p-2 text-left'>Quiz ID</th>
                        <th className='p-2 text-left'>Score</th>
                        <th className='p-2 text-left'>Percentage</th>
                        <th className='p-2 text-left'>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.userAttempts.map((attempt, i) => (
                        <tr key={i} className='border-b'>
                          <td className='p-2'>{attempt.quizId.substring(0, 8)}...</td>
                          <td className='p-2'>{attempt.score}/{attempt.totalPoints}</td>
                          <td className='p-2'>{attempt.percentage.toFixed(1)}%</td>
                          <td className='p-2'>{new Date(attempt.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className='text-gray-500'>No quiz attempts found</p>
              )}
            </div>

            {/* User Enrollments */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold mb-4'>Your Enrollments ({result.userEnrollments.length})</h2>
              {result.userEnrollments.length > 0 ? (
                <div className='space-y-2'>
                  {result.userEnrollments.map((enrollment, i) => (
                    <div key={i} className='bg-gray-50 p-4 rounded'>
                      <p className='font-medium'>Course ID: {enrollment.courseId}</p>
                      <p className='text-sm text-gray-600'>
                        Completed Lectures: {enrollment.completedLectures?.length || 0}
                      </p>
                      <p className='text-sm text-gray-600'>
                        Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500'>No enrollments found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPersonalization;
