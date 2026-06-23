import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  ShieldOff, 
  Lock, 
  Unlock,
  Trash2,
  Eye,
  ArrowLeft,
  Home,
  AlertTriangle
} from 'lucide-react';

const UserManagement = () => {
  const { user } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showDropdown, setShowDropdown] = useState(null);
  const [educatorRequests, setEducatorRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.publicMetadata?.role !== 'admin') {
      navigate('/');
      return;
    }

    loadUsers();
    loadEducatorRequests();
    
    const handleRequestsUpdated = () => {
      loadEducatorRequests();
    };
    
    window.addEventListener('educatorRequestsUpdated', handleRequestsUpdated);
    
    return () => {
      window.removeEventListener('educatorRequestsUpdated', handleRequestsUpdated);
    };
  }, [user, navigate]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  const loadEducatorRequests = () => {
    try {
      const requests = JSON.parse(localStorage.getItem('educatorRequests') || '[]');
      const pendingRequests = requests.filter(r => r.status === 'pending');
      setEducatorRequests(pendingRequests);
    } catch (error) {
      console.error('Error loading educator requests:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const userList = [];
      const processedUsers = new Set();
      
      const allRegisteredUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]')
      
      for (const registeredUser of allRegisteredUsers) {
        if (processedUsers.has(registeredUser.id)) continue;
        processedUsers.add(registeredUser.id);
        
        const educatorCourses = JSON.parse(localStorage.getItem(`educatorCourses_${registeredUser.id}`) || '[]');
        const userEnrollments = JSON.parse(localStorage.getItem(`myEnrollments_${registeredUser.id}`) || '[]');
        
        let userRole = registeredUser.role || 'student';
        if (educatorCourses.length > 0 && userRole === 'student') {
          userRole = 'educator';
        }
        
        userList.push({
          id: registeredUser.id,
          email: registeredUser.email || `user_${registeredUser.id.slice(-8)}@example.com`,
          name: registeredUser.name || `User ${registeredUser.id.slice(-4)}`,
          imageUrl: registeredUser.imageUrl,
          role: userRole,
          status: 'active',
          joinDate: registeredUser.createdAt ? 
                   new Date(registeredUser.createdAt).toLocaleDateString('vi-VN') : 
                   new Date().toLocaleDateString('vi-VN'),
          lastActive: registeredUser.lastLogin ? 
                     new Date(registeredUser.lastLogin).toLocaleDateString('vi-VN') : 
                     new Date().toLocaleDateString('vi-VN'),
          coursesCreated: educatorCourses.length,
          coursesEnrolled: userEnrollments.length
        });
      }
      
      if (user?.id && !processedUsers.has(user.id)) {
        processedUsers.add(user.id);
        
        const educatorCourses = JSON.parse(localStorage.getItem(`educatorCourses_${user.id}`) || '[]');
        const userEnrollments = JSON.parse(localStorage.getItem(`myEnrollments_${user.id}`) || '[]');
        
        userList.push({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || 'admin@example.com',
          name: user.fullName || user.firstName || 'Admin',
          imageUrl: user.imageUrl,
          role: user.publicMetadata?.role || 'admin',
          status: 'active',
          joinDate: new Date(user.createdAt).toLocaleDateString('vi-VN'),
          lastActive: new Date().toLocaleDateString('vi-VN'),
          coursesCreated: educatorCourses.length,
          coursesEnrolled: userEnrollments.length
        });
      }

      console.log('Loaded users:', userList.length);
      setUsers(userList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  };

  const handleApproveEducatorRequest = async (request) => {
    try {
      // Cập nhật trong allRegisteredUsers
      const allRegisteredUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]');
      const updatedUsers = allRegisteredUsers.map(u => 
        u.id === request.userId ? { ...u, role: 'educator' } : u
      );
      localStorage.setItem('allRegisteredUsers', JSON.stringify(updatedUsers));
      
      // Cập nhật request status
      const allRequests = JSON.parse(localStorage.getItem('educatorRequests') || '[]');
      const updatedRequests = allRequests.map(r => 
        r.id === request.id ? { ...r, status: 'approved', approvedAt: new Date().toISOString() } : r
      );
      localStorage.setItem('educatorRequests', JSON.stringify(updatedRequests));
      
      // Cập nhật UI
      setUsers(users.map(u => 
        u.id === request.userId ? { ...u, role: 'educator' } : u
      ));
      
      loadEducatorRequests();
      
      // Lưu thông báo để hiển thị cho user khi họ reload
      const notifications = JSON.parse(localStorage.getItem('userNotifications') || '{}');
      notifications[request.userId] = {
        type: 'educator_approved',
        message: 'Yêu cầu trở thành Giảng viên của bạn đã được phê duyệt!',
        timestamp: new Date().toISOString(),
        read: false
      };
      localStorage.setItem('userNotifications', JSON.stringify(notifications));
      
      // Dispatch event để notify user nếu họ đang online
      window.dispatchEvent(new CustomEvent('userRoleUpdated', { 
        detail: { userId: request.userId, newRole: 'educator' } 
      }));
      
      alert(`✅ Đã phê duyệt yêu cầu của ${request.userName}.\n\nNgười dùng sẽ nhận thông báo và tự động reload trang.`);
      
      window.dispatchEvent(new Event('educatorRequestsUpdated'));
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Có lỗi xảy ra khi phê duyệt yêu cầu');
    }
  };

  const handleRejectEducatorRequest = (request) => {
    if (window.confirm(`Bạn có chắc chắn muốn từ chối yêu cầu của ${request.userName}?`)) {
      try {
        const allRequests = JSON.parse(localStorage.getItem('educatorRequests') || '[]');
        const updatedRequests = allRequests.map(r => 
          r.id === request.id ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString() } : r
        );
        localStorage.setItem('educatorRequests', JSON.stringify(updatedRequests));
        
        loadEducatorRequests();
        
        alert(`Đã từ chối yêu cầu của ${request.userName}`);
        
        window.dispatchEvent(new Event('educatorRequestsUpdated'));
      } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Có lỗi xảy ra khi từ chối yêu cầu');
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Cập nhật trong allRegisteredUsers
      const allRegisteredUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]');
      const updatedUsers = allRegisteredUsers.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      );
      localStorage.setItem('allRegisteredUsers', JSON.stringify(updatedUsers));
      
      // Cập nhật UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setShowDropdown(null);
      
      const roleText = newRole === 'educator' ? 'Giảng viên' : 'Học viên';
      alert(`Đã cập nhật role thành ${roleText}. Người dùng sẽ thấy thay đổi khi đăng nhập lại.`);
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Có lỗi xảy ra khi thay đổi quyền');
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    setShowDropdown(null);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setUsers(users.filter(user => user.id !== userId));
      setShowDropdown(null);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'educator': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
                <p className="text-gray-600">Quản lý tài khoản và quyền người dùng</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {educatorRequests.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-xl font-bold text-yellow-900">
                Yêu Cầu Giảng Viên Đang Chờ ({educatorRequests.length})
              </h2>
            </div>
            <div className="space-y-3">
              {educatorRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {request.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.userName || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-600">{request.userEmail || 'No email'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Yêu cầu lúc: {new Date(request.requestDate).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveEducatorRequest(request)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Phê duyệt
                      </button>
                      <button
                        onClick={() => handleRejectEducatorRequest(request)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
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
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="student">Học viên</option>
                  <option value="educator">Giảng viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Tổng: {filteredUsers.length} người dùng
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoạt động</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thống kê</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'student' ? 'Học viên' : user.role === 'educator' ? 'Giảng viên' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Tham gia: {user.joinDate}</div>
                    <div>Hoạt động: {user.lastActive}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Khóa học tạo: {user.coursesCreated}</div>
                    <div>Khóa học đăng ký: {user.coursesEnrolled}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setShowDropdown(showDropdown === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      
                      {showDropdown === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(null)}></div>
                          <div className={`origin-top-right absolute right-0 ${
                            index >= filteredUsers.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                          } w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20`}>
                            <div className="py-1">
                              <button onClick={() => setShowDropdown(null)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                <Eye className="w-4 h-4 mr-2" />
                                Xem chi tiết
                              </button>
                              {user.role === 'student' && (
                                <button onClick={() => handleRoleChange(user.id, 'educator')} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                  <Shield className="w-4 h-4 mr-2" />
                                  Cấp quyền giảng viên
                                </button>
                              )}
                              {user.role === 'educator' && (
                                <button onClick={() => handleRoleChange(user.id, 'student')} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                  <ShieldOff className="w-4 h-4 mr-2" />
                                  Thu hồi quyền giảng viên
                                </button>
                              )}
                              {user.status === 'active' ? (
                                <button onClick={() => handleStatusChange(user.id, 'blocked')} className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left">
                                  <Lock className="w-4 h-4 mr-2" />
                                  Khóa tài khoản
                                </button>
                              ) : (
                                <button onClick={() => handleStatusChange(user.id, 'active')} className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left">
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Mở khóa tài khoản
                                </button>
                              )}
                              <button onClick={() => handleDeleteUser(user.id)} className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa tài khoản
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-3 text-gray-600">Đang tải dữ liệu người dùng...</span>
            </div>
          )}
          
          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">Không tìm thấy người dùng nào</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
