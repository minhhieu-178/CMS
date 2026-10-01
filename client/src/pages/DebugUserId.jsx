import { useUser, useAuth } from '@clerk/clerk-react';
import { useState } from 'react';

const DebugUserId = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const checkToken = async () => {
    try {
      const token = await getToken();
      
      // Decode JWT to see what's inside
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      setTokenInfo(payload);
      
      // Call analytics API
      const response = await fetch('http://localhost:5000/api/personalization/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setAnalyticsData(data);
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug User ID</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Clerk User Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</div>
            <div><strong>Name:</strong> {user?.fullName}</div>
            <div><strong>Role (metadata):</strong> {user?.publicMetadata?.role || user?.unsafeMetadata?.role}</div>
          </div>
        </div>

        <button
          onClick={checkToken}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Check Token & Call API
        </button>

        {tokenInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">JWT Token Payload</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(tokenInfo, null, 2)}
            </pre>
          </div>
        )}

        {analyticsData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics API Response</h2>
            <div className="mb-4">
              <strong>Success:</strong> {analyticsData.success ? '✅ Yes' : '❌ No'}
            </div>
            <div className="mb-4">
              <strong>Analytics Count:</strong> {analyticsData.analytics?.length || 0}
            </div>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(analyticsData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugUserId;
