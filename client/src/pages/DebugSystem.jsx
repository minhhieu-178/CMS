import { useUser, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

const DebugSystem = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking');
  const [envVars, setEnvVars] = useState({});
  const [mongoData, setMongoData] = useState(null);
  const [localStorageData, setLocalStorageData] = useState(null);

  useEffect(() => {
    checkSystem();
  }, []);

  const checkSystem = async () => {
    // 1. Check environment variables
    const env = {
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
      VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
      VITE_USE_LOCALSTORAGE_ONLY: import.meta.env.VITE_USE_LOCALSTORAGE_ONLY,
    };
    setEnvVars(env);

    // 2. Check backend connection
    try {
      const response = await fetch(`${env.VITE_BACKEND_URL}/api/student/courses`);
      if (response.ok) {
        setBackendStatus('connected ✅');
      } else {
        setBackendStatus(`error ${response.status} ❌`);
      }
    } catch (error) {
      setBackendStatus(`offline ❌ (${error.message})`);
    }

    // 3. Check LocalStorage
    const localData = {
      myEnrollments: JSON.parse(localStorage.getItem('myEnrollments') || '[]'),
      educatorCourses: JSON.parse(localStorage.getItem(`educatorCourses_${user?.id}`) || '[]'),
      globalCourses: JSON.parse(localStorage.getItem('globalCourses') || '[]'),
    };
    setLocalStorageData(localData);
  };

  const testEnrollment = async () => {
    try {
      const token = await getToken();
      
      // Get first available course
      const coursesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/courses`);
      const coursesData = await coursesResponse.json();
      
      if (!coursesData.success || coursesData.courses.length === 0) {
        alert('Không có khóa học nào để test!');
        return;
      }
      
      const firstCourse = coursesData.courses[0];
      console.log('Testing with course:', firstCourse._id);
      
      // Try to enroll
      const enrollResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/enrollment/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: firstCourse._id,
          amount: 0,
          enrollmentType: 'demo'
        })
      });
      
      const enrollData = await enrollResponse.json();
      console.log('Enrollment result:', enrollData);
      
      alert(JSON.stringify(enrollData, null, 2));
      
      // Reload data
      checkMongoData();
      
    } catch (error) {
      console.error('Test enrollment error:', error);
      alert('Error: ' + error.message);
    }
  };

  const checkMongoData = async () => {
    try {
      const token = await getToken();
      
      // Get enrollments from MongoDB
      const enrollmentsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/enrollment/my-enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const enrollmentsData = await enrollmentsResponse.json();
      
      // Get analytics from MongoDB
      const analyticsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/personalization/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const analyticsData = await analyticsResponse.json();
      
      setMongoData({
        enrollments: enrollmentsData,
        analytics: analyticsData
      });
      
    } catch (error) {
      console.error('Error checking MongoDB:', error);
      setMongoData({ error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">System Debug Dashboard</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 User Info</h2>
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</div>
            <div><strong>Name:</strong> {user?.fullName}</div>
            <div><strong>Role:</strong> {user?.publicMetadata?.role || user?.unsafeMetadata?.role || 'student'}</div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚙️ Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex">
                <strong className="w-64">{key}:</strong>
                <span className="text-blue-600">{value || '(not set)'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔌 Backend Connection</h2>
          <div className="text-lg">
            Status: <span className={backendStatus.includes('✅') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {backendStatus}
            </span>
          </div>
          <button
            onClick={checkSystem}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recheck Connection
          </button>
        </div>

        {/* LocalStorage Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">💾 LocalStorage Data</h2>
          {localStorageData && (
            <div className="space-y-4">
              <div>
                <strong>My Enrollments:</strong> {localStorageData.myEnrollments.length} items
              </div>
              <div>
                <strong>Educator Courses:</strong> {localStorageData.educatorCourses.length} items
              </div>
              <div>
                <strong>Global Courses:</strong> {localStorageData.globalCourses.length} items
              </div>
            </div>
          )}
        </div>

        {/* MongoDB Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🍃 MongoDB Data</h2>
          <button
            onClick={checkMongoData}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Check MongoDB Data
          </button>
          {mongoData && (
            <div className="space-y-4">
              {mongoData.error ? (
                <div className="text-red-600">Error: {mongoData.error}</div>
              ) : (
                <>
                  <div>
                    <strong>Enrollments:</strong> {mongoData.enrollments?.enrollments?.length || 0} items
                    <div className="text-sm text-gray-600">
                      Success: {mongoData.enrollments?.success ? '✅' : '❌'}
                    </div>
                  </div>
                  <div>
                    <strong>Analytics:</strong> {mongoData.analytics?.analytics?.length || 0} items
                    <div className="text-sm text-gray-600">
                      Success: {mongoData.analytics?.success ? '✅' : '❌'}
                    </div>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Show Raw Data
                    </summary>
                    <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(mongoData, null, 2)}
                    </pre>
                  </details>
                </>
              )}
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testEnrollment}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test Enroll in Course
            </button>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">🔍 Diagnosis</h2>
          <div className="space-y-2 text-sm">
            {backendStatus.includes('❌') && (
              <div className="text-red-600">
                ❌ Backend is not running or not accessible. Start the server with: <code className="bg-gray-100 px-2 py-1 rounded">cd server && npm run server</code>
              </div>
            )}
            {envVars.VITE_USE_LOCALSTORAGE_ONLY === 'true' && (
              <div className="text-orange-600">
                ⚠️ VITE_USE_LOCALSTORAGE_ONLY is true - System is using LocalStorage instead of MongoDB
              </div>
            )}
            {!envVars.VITE_BACKEND_URL && (
              <div className="text-red-600">
                ❌ VITE_BACKEND_URL is not set
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugSystem;
