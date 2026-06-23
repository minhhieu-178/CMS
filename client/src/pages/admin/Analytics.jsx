import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home,
  Users, 
  BookOpen, 
  Star,
  TrendingUp,
  Award,
  UserCheck,
  GraduationCap,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';

const Analytics = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: {
      total: 0,
      students: 0,
      educators: 0,
      admins: 0,
      activeThisMonth: 0
    },
    courses: {
      total: 0,
      byCategory: {},
      topRated: [],
      mostEnrolled: []
    },
    enrollments: {
      total: 0,
      thisMonth: 0,
      byType: { creator: 0, demo: 0, paid: 0 }
    },
    ratings: {
      average: 0,
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  });

  useEffect(() => {
    if (!user || user.publicMetadata?.role !== 'admin') {
      navigate('/');
      return;
    }

    calculateDetailedStats();
  }, [user, navigate]);

  const calculateDetailedStats = () => {
    try {
      const allKeys = Object.keys(localStorage);
      
      // === THỐNG KÊ NGƯỜI DÙNG ===
      const allRegisteredUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]');
      const userStats = {
        total: allRegisteredUsers.length,
        students: 0,
        educators: 0,
        admins: 0,
        activeThisMonth: 0
      };

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      allRegisteredUsers.forEach(u => {
        if (u.role === 'student') userStats.students++;
        else if (u.role === 'educator') userStats.educators++;
        else if (u.role === 'admin') userStats.admins++;

        if (u.lastLogin) {
          const lastLogin = new Date(u.lastLogin);
          if (lastLogin.getMonth() === thisMonth && lastLogin.getFullYear() === thisYear) {
            userStats.activeThisMonth++;
          }
        }
      });

      // === THỐNG KÊ KHÓA HỌC ===
      const educatorKeys = allKeys.filter(key => key.startsWith('educatorCourses_'));
      const allCourses = [];
      const categoryCount = {};

      educatorKeys.forEach(key => {
        const courses = JSON.parse(localStorage.getItem(key) || '[]');
        courses.forEach(course => {
          allCourses.push(course);
          
          // Đếm theo danh mục
          const category = course.category || 'Khác';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
      });

      // Top khóa học theo rating
      const coursesWithRating = allCourses.map(course => {
        let avgRating = 0;
        let ratingCount = 0;
        
        if (course.ratings && Array.isArray(course.ratings)) {
          const validRatings = course.ratings.filter(r => r.stars);
          if (validRatings.length > 0) {
            avgRating = validRatings.reduce((sum, r) => sum + r.stars, 0) / validRatings.length;
            ratingCount = validRatings.length;
          }
        }
        
        return { ...course, avgRating, ratingCount };
      });

      const topRated = coursesWithRating
        .filter(c => c.ratingCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5);

      // === THỐNG KÊ ĐĂNG KÝ ===
      const enrollmentKeys = allKeys.filter(key => key.startsWith('myEnrollments_') || key === 'myEnrollments');
      let totalEnrollments = 0;
      let enrollmentsThisMonth = 0;
      const enrollmentsByType = { creator: 0, demo: 0, paid: 0 };
      const courseEnrollmentCount = {};

      enrollmentKeys.forEach(key => {
        const enrollments = JSON.parse(localStorage.getItem(key) || '[]');
        totalEnrollments += enrollments.length;
        
        enrollments.forEach(enrollment => {
          // Đếm theo loại
          const type = enrollment.type || 'demo';
          enrollmentsByType[type] = (enrollmentsByType[type] || 0) + 1;
          
          // Đếm theo khóa học
          const courseId = enrollment.courseId || enrollment.id;
          courseEnrollmentCount[courseId] = (courseEnrollmentCount[courseId] || 0) + 1;
          
          // Đếm đăng ký tháng này
          if (enrollment.enrolledAt) {
            const enrollDate = new Date(enrollment.enrolledAt);
            if (enrollDate.getMonth() === thisMonth && enrollDate.getFullYear() === thisYear) {
              enrollmentsThisMonth++;
            }
          }
        });
      });

      // Top khóa học theo số đăng ký
      const mostEnrolled = allCourses
        .map(course => ({
          ...course,
          enrollmentCount: courseEnrollmentCount[course.id] || 0
        }))
        .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
        .slice(0, 5);

      // === THỐNG KÊ ĐÁNH GIÁ ===
      let totalRatings = 0;
      let ratingSum = 0;
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      allCourses.forEach(course => {
        if (course.ratings && Array.isArray(course.ratings)) {
          course.ratings.forEach(rating => {
            if (rating.stars) {
              totalRatings++;
              ratingSum += rating.stars;
              ratingDistribution[rating.stars]++;
            }
          });
        }
      });

      setStats({
        users: userStats,
        courses: {
          total: allCourses.length,
          byCategory: categoryCount,
          topRated,
          mostEnrolled
        },
        enrollments: {
          total: totalEnrollments,
          thisMonth: enrollmentsThisMonth,
          byType: enrollmentsByType
        },
        ratings: {
          average: totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : 0,
          total: totalRatings,
          distribution: ratingDistribution
        }
      });
    } catch (error) {
      console.error('Error calculating detailed stats:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-8 h-8" style={{ color }} />
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const ProgressBar = ({ label, value, max, color }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700">{label}</span>
          <span className="text-gray-900 font-semibold">{value}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')} className="flex items-center text-gray-600 hover:text-gray-900">
                <Home className="w-5 h-5 mr-2" />
                Trang chủ
              </button>
              <span className="text-gray-300">|</span>
              <button onClick={() => navigate('/admin')} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Thống Kê Chi Tiết</h1>
                <p className="text-gray-600">Phân tích và báo cáo hệ thống</p>
              </div>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-5 h-5 mr-2" />
              Xuất Báo Cáo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Thống kê người dùng */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Thống Kê Người Dùng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Users}
              title="Tổng Người Dùng"
              value={stats.users.total}
              color="#3B82F6"
            />
            <StatCard
              icon={GraduationCap}
              title="Học Viên"
              value={stats.users.students}
              subtitle={`${((stats.users.students / stats.users.total) * 100 || 0).toFixed(0)}% tổng số`}
              color="#10B981"
            />
            <StatCard
              icon={Award}
              title="Giảng Viên"
              value={stats.users.educators}
              subtitle={`${((stats.users.educators / stats.users.total) * 100 || 0).toFixed(0)}% tổng số`}
              color="#F59E0B"
            />
            <StatCard
              icon={UserCheck}
              title="Hoạt Động Tháng Này"
              value={stats.users.activeThisMonth}
              subtitle={`${((stats.users.activeThisMonth / stats.users.total) * 100 || 0).toFixed(0)}% tổng số`}
              color="#8B5CF6"
            />
          </div>
        </div>

        {/* Thống kê khóa học */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-green-600" />
            Thống Kê Khóa Học
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phân bố theo danh mục */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                Phân Bố Theo Danh Mục
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.courses.byCategory).map(([category, count]) => (
                  <ProgressBar
                    key={category}
                    label={category}
                    value={count}
                    max={stats.courses.total}
                    color="#10B981"
                  />
                ))}
                {Object.keys(stats.courses.byCategory).length === 0 && (
                  <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
                )}
              </div>
            </div>

            {/* Top khóa học theo rating */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Top Khóa Học Đánh Giá Cao
              </h3>
              <div className="space-y-3">
                {stats.courses.topRated.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-xs text-gray-500">{course.ratingCount} đánh giá</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-bold text-gray-900">{course.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
                {stats.courses.topRated.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Chưa có đánh giá</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê đăng ký */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-orange-600" />
            Thống Kê Đăng Ký
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tổng quan đăng ký */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng Quan</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Tổng đăng ký</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.enrollments.total}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Đăng ký tháng này</span>
                  <span className="text-2xl font-bold text-green-600">{stats.enrollments.thisMonth}</span>
                </div>
              </div>
            </div>

            {/* Phân bố theo loại */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                Phân Bố Theo Loại
              </h3>
              <div className="space-y-3">
                <ProgressBar
                  label="Creator (Miễn phí)"
                  value={stats.enrollments.byType.creator}
                  max={stats.enrollments.total}
                  color="#10B981"
                />
                <ProgressBar
                  label="Demo (Miễn phí)"
                  value={stats.enrollments.byType.demo}
                  max={stats.enrollments.total}
                  color="#3B82F6"
                />
                <ProgressBar
                  label="Paid (Test)"
                  value={stats.enrollments.byType.paid}
                  max={stats.enrollments.total}
                  color="#F59E0B"
                />
              </div>
            </div>
          </div>

          {/* Top khóa học theo đăng ký */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
              Top Khóa Học Nhiều Đăng Ký Nhất
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.courses.mostEnrolled.map((course, index) => (
                <div key={course.id} className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-orange-600">#{index + 1}</span>
                    <p className="font-medium text-gray-900 mt-2 line-clamp-2">{course.title}</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">{course.enrollmentCount}</p>
                    <p className="text-xs text-gray-600">đăng ký</p>
                  </div>
                </div>
              ))}
              {stats.courses.mostEnrolled.length === 0 && (
                <p className="text-gray-500 text-center py-4 col-span-5">Chưa có đăng ký</p>
              )}
            </div>
          </div>
        </div>

        {/* Thống kê đánh giá */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            Thống Kê Đánh Giá
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tổng quan đánh giá */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tổng Quan</h3>
              <div className="text-center py-6">
                <div className="text-6xl font-bold text-yellow-500 mb-2">{stats.ratings.average}</div>
                <div className="flex items-center justify-center mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      className={`w-6 h-6 ${star <= Math.round(stats.ratings.average) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">Trung bình từ {stats.ratings.total} đánh giá</p>
              </div>
            </div>

            {/* Phân bố đánh giá */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân Bố Đánh Giá</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(stars => (
                  <div key={stars} className="flex items-center space-x-3">
                    <div className="flex items-center w-16">
                      <span className="text-sm font-medium text-gray-700">{stars}</span>
                      <Star className="w-4 h-4 text-yellow-500 ml-1" />
                    </div>
                    <div className="flex-1">
                      <ProgressBar
                        label=""
                        value={stats.ratings.distribution[stars]}
                        max={stats.ratings.total}
                        color="#EAB308"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {stats.ratings.distribution[stars]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
