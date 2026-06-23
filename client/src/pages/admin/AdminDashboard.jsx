import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Home
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    averageRating: 0,
    pendingReports: 0,
    activeUsers: 0,
    pendingEducatorRequests: 0
  });

  useEffect(() => {
    // Kiểm tra quyền admin
    if (!user || user.publicMetadata?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Tính toán thống kê từ LocalStorage
    calculateStats();
    
    // Listen for educator request updates
    const handleRequestsUpdated = () => {
      calculateStats();
    };
    
    window.addEventListener('educatorRequestsUpdated', handleRequestsUpdated);
    
    return () => {
      window.removeEventListener('educatorRequestsUpdated', handleRequestsUpdated);
    };
  }, [user, navigate]);

  const calculateStats = () => {
    try {
      // Lấy tất cả keys từ LocalStorage
      const allKeys = Object.keys(localStorage);
      const educatorKeys = allKeys.filter(key => key.startsWith('educatorCourses_'));
      const enrollmentKeys = allKeys.filter(key => key === 'myEnrollments' || key.startsWith('myEnrollments_'));
      
      let totalCourses = 0;
      let totalEnrollments = 0;
      let totalRatings = 0;
      let ratingCount = 0;
      const uniqueUsers = new Set();

      // Đếm khóa học và đánh giá thực tế
      educatorKeys.forEach(key => {
        const userId = key.replace('educatorCourses_', '');
        uniqueUsers.add(userId);
        
        const courses = JSON.parse(localStorage.getItem(key) || '[]');
        totalCourses += courses.length;
        
        // Đếm đánh giá thực tế
        courses.forEach(course => {
          if (course.ratings && Array.isArray(course.ratings) && course.ratings.length > 0) {
            course.ratings.forEach(rating => {
              if (rating.stars) {
                totalRatings += rating.stars;
                ratingCount++;
              }
            });
          }
        });
      });

      // Đếm đăng ký thực tế
      enrollmentKeys.forEach(key => {
        const userId = key === 'myEnrollments' ? user?.id || 'current_user' : key.replace('myEnrollments_', '');
        uniqueUsers.add(userId);
        
        const enrollments = JSON.parse(localStorage.getItem(key) || '[]');
        totalEnrollments += enrollments.length;
      });

      // Tính số người dùng hoạt động (có khóa học hoặc đăng ký)
      const activeUsers = uniqueUsers.size;
      
      // Đếm yêu cầu giảng viên đang chờ
      const educatorRequests = JSON.parse(localStorage.getItem('educatorRequests') || '[]');
      const pendingRequests = educatorRequests.filter(r => r.status === 'pending').length;

      setStats({
        totalUsers: activeUsers,
        totalCourses,
        totalEnrollments,
        averageRating: ratingCount > 0 ? (totalRatings / ratingCount).toFixed(1) : 0,
        pendingReports: 0, // Chưa có hệ thống báo cáo
        activeUsers: activeUsers,
        pendingEducatorRequests: pendingRequests
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <Icon className="w-8 h-8" style={{ color }} />
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, onClick, color }) => (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4"
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <div className="flex items-center">
        <Icon className="w-6 h-6 mr-3" style={{ color }} />
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  if (!user || user.publicMetadata?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền Admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Quản trị hệ thống khóa học online</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Trang chủ
              </button>
              <span className="text-sm text-gray-600">Xin chào, {user.firstName}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Tổng Người Dùng"
            value={stats.totalUsers}
            color="#3B82F6"
            trend="+12% tháng này"
          />
          <StatCard
            icon={BookOpen}
            title="Tổng Khóa Học"
            value={stats.totalCourses}
            color="#10B981"
            trend="+8% tháng này"
          />
          <StatCard
            icon={Users}
            title="Tổng Đăng Ký"
            value={stats.totalEnrollments}
            color="#F59E0B"
            trend="+15% tháng này"
          />
          <StatCard
            icon={Star}
            title="Đánh Giá Trung Bình"
            value={`${stats.averageRating}/5`}
            color="#EF4444"
          />
          <StatCard
            icon={AlertTriangle}
            title="Báo Cáo Chờ Xử Lý"
            value={stats.pendingReports}
            color="#F97316"
          />
          <StatCard
            icon={CheckCircle}
            title="Người Dùng Hoạt Động"
            value={stats.activeUsers}
            color="#8B5CF6"
          />
        </div>

        {/* Pending Educator Requests Alert */}
        {stats.pendingEducatorRequests > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Có {stats.pendingEducatorRequests} yêu cầu giảng viên đang chờ phê duyệt
                  </h3>
                  <p className="text-sm text-yellow-700">Vui lòng xem xét và phê duyệt các yêu cầu</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Xem ngay
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thao Tác Nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              icon={Users}
              title="Quản Lý Người Dùng"
              description="Xem và quản lý tài khoản"
              onClick={() => navigate('/admin/users')}
              color="#3B82F6"
            />
            <QuickAction
              icon={BookOpen}
              title="Quản Lý Khóa Học"
              description="Duyệt và quản lý khóa học"
              onClick={() => navigate('/admin/courses')}
              color="#10B981"
            />
            <QuickAction
              icon={AlertTriangle}
              title="Yêu Cầu Giảng Viên"
              description={`${stats.pendingEducatorRequests} yêu cầu đang chờ`}
              onClick={() => navigate('/admin/users')}
              color="#F59E0B"
            />
            <QuickAction
              icon={Eye}
              title="Thống Kê Chi Tiết"
              description="Xem báo cáo chi tiết"
              onClick={() => navigate('/admin/analytics')}
              color="#8B5CF6"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Hoạt Động Gần Đây</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Khóa học "React Cơ Bản" đã được duyệt</span>
                <span className="text-xs text-gray-400">2 giờ trước</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Người dùng mới đăng ký: john@example.com</span>
                <span className="text-xs text-gray-400">4 giờ trước</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Báo cáo vi phạm mới cần xử lý</span>
                <span className="text-xs text-gray-400">6 giờ trước</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Khóa học "Python Advanced" bị ẩn do vi phạm</span>
                <span className="text-xs text-gray-400">1 ngày trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;