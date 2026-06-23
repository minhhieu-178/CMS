import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  EyeOff,
  CheckCircle,
  Trash2,
  ArrowLeft,
  Star,
  Users,
  Home
} from 'lucide-react';
import { dummyCourses } from '../../assets/assets';

const CourseManagement = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDropdown, setShowDropdown] = useState(null);

  useEffect(() => {
    // Kiểm tra quyền admin
    if (!user || user.publicMetadata?.role !== 'admin') {
      navigate('/');
      return;
    }

    loadCourses();
  }, [user, navigate]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterStatus]);

  const loadCourses = () => {
    try {
      // Lấy tất cả khóa học thực từ LocalStorage
      const allKeys = Object.keys(localStorage);
      const educatorKeys = allKeys.filter(key => key.startsWith('educatorCourses_'));
      
      const allCourses = [];
      
      // Load khóa học từ LocalStorage
      educatorKeys.forEach(key => {
        const educatorId = key.replace('educatorCourses_', '');
        const courses = JSON.parse(localStorage.getItem(key) || '[]');
        
        courses.forEach(course => {
          // Tính số lượng đăng ký thực tế
          let enrollmentCount = 0;
          const enrollmentKeys = allKeys.filter(k => k === 'myEnrollments' || k.startsWith('myEnrollments_'));
          enrollmentKeys.forEach(enrollKey => {
            const enrollments = JSON.parse(localStorage.getItem(enrollKey) || '[]');
            enrollmentCount += enrollments.filter(e => e.id === course.id).length;
          });

          // Tính đánh giá trung bình thực tế
          let averageRating = 0;
          let ratingCount = 0;
          if (course.ratings && Array.isArray(course.ratings) && course.ratings.length > 0) {
            const totalRating = course.ratings.reduce((sum, rating) => sum + (rating.stars || 0), 0);
            ratingCount = course.ratings.length;
            averageRating = (totalRating / ratingCount).toFixed(1);
          }

          // Lấy thông tin giảng viên - đảm bảo là string
          let educatorName = 'Giảng viên';
          if (course.educatorName && typeof course.educatorName === 'string') {
            educatorName = course.educatorName;
          } else if (course.educator && typeof course.educator === 'string') {
            educatorName = course.educator;
          } else if (course.educator && typeof course.educator === 'object' && course.educator.name) {
            educatorName = course.educator.name;
          } else {
            educatorName = `Giảng viên ${educatorId.slice(-4)}`;
          }

          allCourses.push({
            ...course,
            id: course.id || course._id,
            title: course.title || course.courseTitle || 'Không có tiêu đề',
            description: course.description || course.courseDescription || 'Không có mô tả',
            thumbnail: course.thumbnail || course.courseThumbnail || '',
            educatorId,
            educatorName,
            enrollmentCount,
            averageRating,
            ratingCount,
            status: course.status || 'approved',
            createdDate: course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
            lastUpdated: course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
            source: 'localStorage'
          });
        });
      });

      // Thêm khóa học mẫu từ assets.js
      dummyCourses.forEach(course => {
        // Tính đánh giá trung bình từ courseRatings
        let averageRating = 0;
        let ratingCount = 0;
        if (course.courseRatings && Array.isArray(course.courseRatings) && course.courseRatings.length > 0) {
          const totalRating = course.courseRatings.reduce((sum, rating) => sum + (rating.rating || 0), 0);
          ratingCount = course.courseRatings.length;
          averageRating = (totalRating / ratingCount).toFixed(1);
        }

        // Lấy tên giảng viên
        let educatorName = 'Giảng viên';
        if (course.educator && typeof course.educator === 'object' && course.educator.name) {
          educatorName = course.educator.name;
        } else if (course.educator && typeof course.educator === 'string') {
          educatorName = course.educator;
        }

        allCourses.push({
          id: course._id,
          title: course.courseTitle,
          description: course.courseDescription?.replace(/<[^>]*>/g, '').substring(0, 150) + '...' || 'Không có mô tả',
          thumbnail: course.courseThumbnail || '',
          educatorId: typeof course.educator === 'object' ? course.educator._id : course.educator,
          educatorName,
          enrollmentCount: course.enrolledStudents?.length || 0,
          averageRating,
          ratingCount,
          status: course.isPublished ? 'approved' : 'pending',
          createdDate: course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          lastUpdated: course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          source: 'sample'
        });
      });

      // Sắp xếp theo ngày tạo mới nhất
      allCourses.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setCourses(allCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Lọc theo tìm kiếm
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.educatorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lọc theo trạng thái
    if (filterStatus !== 'all') {
      filtered = filtered.filter(course => course.status === filterStatus);
    }

    setFilteredCourses(filtered);
  };

  const handleStatusChange = (courseId, newStatus) => {
    setCourses(courses.map(course => 
      course.id === courseId ? { ...course, status: newStatus } : course
    ));
    setShowDropdown(null);
  };

  const handleDeleteCourse = (courseId, educatorId, source) => {
    console.log('Delete course:', { courseId, educatorId, source });
    
    // Không cho xóa khóa học mẫu
    if (source === 'sample') {
      console.log('Cannot delete sample course');
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-fade-in-right bg-red-500';
      toast.textContent = 'Không thể xóa khóa học mẫu';
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      setShowDropdown(null);
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.')) {
      try {
        console.log('Deleting course from localStorage...');
        
        // Xóa khỏi LocalStorage của giảng viên TRƯỚC
        const key = `educatorCourses_${educatorId}`;
        const educatorCourses = JSON.parse(localStorage.getItem(key) || '[]');
        console.log('Current courses:', educatorCourses.length);
        
        const updatedCourses = educatorCourses.filter(course => (course.id || course._id) !== courseId);
        console.log('After delete:', updatedCourses.length);
        
        localStorage.setItem(key, JSON.stringify(updatedCourses));
        
        // Trigger event để các component khác cập nhật
        window.dispatchEvent(new Event('coursesUpdated'));
        
        // Reload lại danh sách khóa học
        loadCourses();
        
        // Hiển thị thông báo
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-fade-in-right bg-green-500';
        toast.textContent = 'Đã xóa khóa học thành công';
        document.body.appendChild(toast);
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 3000);
        
        setShowDropdown(null);
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Có lỗi xảy ra khi xóa khóa học: ' + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'hidden': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'hidden': return 'Đã ẩn';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <Home className="w-5 h-5 mr-2" />
                Trang chủ
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Khóa Học</h1>
                <p className="text-gray-600">Duyệt và quản lý tất cả khóa học</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khóa học, giảng viên..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="hidden">Đã ẩn</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Tổng: {filteredCourses.length} khóa học
              </div>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Course Image */}
              <div className="relative h-48 bg-gray-200">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span>Không có ảnh</span>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                    {getStatusText(course.status)}
                  </span>
                </div>

                {/* Actions Dropdown */}
                <div className="absolute top-2 right-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === course.id ? null : course.id)}
                      className="bg-white rounded-full p-2 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {showDropdown === course.id && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowDropdown(null)}
                        ></div>
                        
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl z-20 border-2 border-gray-200">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                navigate(`/course/${course.id}`);
                                setShowDropdown(null);
                              }}
                              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full text-left transition-colors"
                            >
                              <Eye className="w-5 h-5 mr-3 text-blue-600" />
                              <span className="font-medium">Xem chi tiết</span>
                            </button>
                            
                            {course.status === 'pending' && (
                              <button
                                onClick={() => {
                                  handleStatusChange(course.id, 'approved');
                                  setShowDropdown(null);
                                }}
                                className="flex items-center px-4 py-3 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors"
                              >
                                <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                                <span className="font-medium">Duyệt khóa học</span>
                              </button>
                            )}
                            
                            {course.status === 'approved' && (
                              <button
                                onClick={() => {
                                  handleStatusChange(course.id, 'hidden');
                                  setShowDropdown(null);
                                }}
                                className="flex items-center px-4 py-3 text-sm text-yellow-700 hover:bg-yellow-50 w-full text-left transition-colors"
                              >
                                <EyeOff className="w-5 h-5 mr-3 text-yellow-600" />
                                <span className="font-medium">Ẩn khóa học</span>
                              </button>
                            )}
                            
                            {course.status === 'hidden' && (
                              <button
                                onClick={() => {
                                  handleStatusChange(course.id, 'approved');
                                  setShowDropdown(null);
                                }}
                                className="flex items-center px-4 py-3 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors"
                              >
                                <Eye className="w-5 h-5 mr-3 text-green-600" />
                                <span className="font-medium">Hiện khóa học</span>
                              </button>
                            )}
                            
                            <div className="border-t border-gray-200 my-1"></div>
                            
                            <button
                              onClick={() => {
                                handleDeleteCourse(course.id, course.educatorId, course.source);
                                setShowDropdown(null);
                              }}
                              className="flex items-center px-4 py-3 text-sm text-red-700 hover:bg-red-50 w-full text-left transition-colors"
                            >
                              <Trash2 className="w-5 h-5 mr-3 text-red-600" />
                              <span className="font-medium">Xóa khóa học</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>Giảng viên: {course.educatorName}</span>
                  <span>Tạo: {course.createdDate}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600">{course.enrollmentCount}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {course.averageRating > 0 ? course.averageRating : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Cập nhật: {course.lastUpdated}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Không tìm thấy khóa học nào</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;