import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const MigrateAnalytics = () => {
  const { getToken } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const handleMigrate = async () => {
    if (!confirm('Bạn có chắc muốn migrate tất cả enrollments sang LearningAnalytics?\n\nĐiều này sẽ tạo LearningAnalytics records cho tất cả các enrollments hiện có.')) {
      return;
    }

    try {
      setMigrating(true);
      setResult(null);

      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/enrollment/migrate-to-analytics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.stats);
        toast.success('Migration hoàn thành thành công!');
      } else {
        toast.error(data.message || 'Migration thất bại');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Có lỗi xảy ra: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Migrate Enrollments to Analytics
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Thông tin về Migration
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Tạo LearningAnalytics records cho tất cả các enrollments hiện có</li>
              <li>• Bỏ qua các records đã tồn tại (không tạo duplicate)</li>
              <li>• Copy progress data từ Enrollment sang LearningAnalytics</li>
              <li>• An toàn để chạy nhiều lần</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-900 mb-3">
              ⚠️ Lưu ý
            </h2>
            <p className="text-gray-700">
              Sau khi migrate, tất cả các khóa học đã đăng ký sẽ hiển thị trên trang Analytics
              của sinh viên, kể cả những khóa học chưa bắt đầu học.
            </p>
          </div>

          <button
            onClick={handleMigrate}
            disabled={migrating}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              migrating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {migrating ? 'Đang migrate...' : 'Bắt đầu Migration'}
          </button>

          {result && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">
                ✅ Migration hoàn thành!
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{result.total}</div>
                  <div className="text-sm text-gray-600">Tổng enrollments</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{result.created}</div>
                  <div className="text-sm text-gray-600">Đã tạo mới</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{result.skipped}</div>
                  <div className="text-sm text-gray-600">Đã tồn tại (bỏ qua)</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                  <div className="text-sm text-gray-600">Lỗi</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Hướng dẫn sử dụng:</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
              <li>Click "Bắt đầu Migration" để migrate tất cả enrollments</li>
              <li>Đợi quá trình hoàn tất (có thể mất vài giây)</li>
              <li>Kiểm tra kết quả hiển thị</li>
              <li>Vào trang Analytics của sinh viên để xác nhận</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrateAnalytics;
