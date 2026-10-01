# Hướng Dẫn Sửa Lỗi Analytics Không Hiển Thị Khóa Học

## Vấn đề
Trang Analytics của các tài khoản không hiển thị các khóa học đã đăng ký.

## Nguyên nhân
LearningAnalytics record chỉ được tạo khi sinh viên tương tác (đánh dấu lecture hoàn thành hoặc làm quiz), KHÔNG được tạo khi đăng ký khóa học. Do đó các enrollments cũ không có analytics data.

## Giải pháp đã triển khai

### 1. Tự động tạo LearningAnalytics khi enroll (cho enrollments mới)
File: `server/controllers/enrollmentController.js`

Đã thêm logic tự động tạo LearningAnalytics record ngay khi sinh viên đăng ký khóa học mới.

### 2. Migration tool cho enrollments cũ
Đã tạo:
- **Backend API**: `/api/enrollment/migrate-to-analytics` (POST)
- **Admin Page**: `/admin/migrate-analytics`

## Cách sử dụng

### Bước 1: Chạy migration cho dữ liệu cũ

1. Đăng nhập với tài khoản Admin
2. Vào Admin Dashboard: `http://localhost:5173/admin`
3. Trong phần "Công Cụ Quản Trị", click "Migrate Analytics"
4. Hoặc truy cập trực tiếp: `http://localhost:5173/admin/migrate-analytics`
5. Click nút "Bắt đầu Migration"
6. Đợi quá trình hoàn tất và xem kết quả

### Bước 2: Kiểm tra kết quả

1. Đăng nhập với các tài khoản student đã có enrollments
2. Vào trang Analytics: `/analytics`
3. Tất cả các khóa học đã đăng ký sẽ hiển thị, kể cả những khóa học chưa bắt đầu học

### Bước 3: Test với enrollments mới

1. Đăng ký một khóa học mới với bất kỳ tài khoản student nào
2. Kiểm tra ngay trang Analytics - khóa học mới sẽ xuất hiện ngay lập tức
3. Không cần chờ sinh viên bắt đầu học

## Lưu ý kỹ thuật

### Migration API
```javascript
POST /api/enrollment/migrate-to-analytics
Authorization: Bearer <token>

Response:
{
  success: true,
  message: 'Migration completed',
  stats: {
    created: 15,      // Số LearningAnalytics đã tạo mới
    skipped: 3,       // Số records đã tồn tại (bỏ qua)
    errors: 0,        // Số lỗi xảy ra
    total: 18         // Tổng số enrollments
  }
}
```

### Data Structure
Mỗi LearningAnalytics record được tạo với cấu trúc:

```javascript
{
  userId: "user_xxx",
  courseId: ObjectId,
  progress: {
    completedLectures: [],        // Copy từ Enrollment
    overallProgress: 0,            // Copy từ Enrollment
    lastAccessedDate: Date
  },
  learningPattern: {
    averageQuizScore: 0,
    totalQuizzesTaken: 0,
    quizRetakeCount: 0,
    weakTopics: [],
    strongTopics: [],
    learningLevel: 'beginner'
  },
  recommendations: {
    suggestedCourses: [],
    nextLessons: [],
    reviewTopics: [],
    lastUpdated: Date
  }
}
```

### An toàn
- Migration có thể chạy nhiều lần mà không tạo duplicate
- Sử dụng unique index: `{ userId: 1, courseId: 1 }`
- Copy progress data từ Enrollment sang LearningAnalytics

## Troubleshooting

### Vẫn không thấy khóa học trên Analytics?
1. Kiểm tra console log xem có lỗi không
2. Xác nhận đã chạy migration
3. Kiểm tra database có LearningAnalytics record không
4. Hard refresh trang (Ctrl + Shift + R)

### Lỗi 404 khi call API?
Kiểm tra:
- Backend đang chạy tại đúng port: `http://localhost:5000`
- Environment variable `VITE_BACKEND_URL` trong client/.env
- Route đã được đăng ký trong server.js

### Migration bị lỗi?
- Kiểm tra MongoDB connection
- Xem server logs để biết chi tiết lỗi
- Đảm bảo model LearningAnalytics đã được import đúng

## Cấu trúc file liên quan

```
server/
├── controllers/
│   └── enrollmentController.js       # enrollCourse + migrateEnrollmentsToAnalytics
├── models/
│   ├── Enrollment.js
│   └── LearningAnalytics.js
└── routes/
    └── enrollmentRoutes.js           # POST /migrate-to-analytics

client/
├── src/
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx    # Link to migration page
│   │   │   └── MigrateAnalytics.jsx  # Migration UI
│   │   └── student/
│   │       └── LearningAnalytics.jsx # Displays analytics
│   └── App.jsx                        # Route /admin/migrate-analytics
```

## Test Checklist

- [x] Đăng ký khóa học mới → Xuất hiện ngay trên Analytics
- [x] Chạy migration → Tất cả enrollments cũ có analytics
- [x] Không tạo duplicate khi chạy migration nhiều lần
- [x] Progress data được copy từ Enrollment
- [x] Analytics page hiển thị đúng data
- [x] Error handling khi migration fails
- [x] Admin permission cho migration endpoint

## Đã sửa

✅ Backend tự động tạo LearningAnalytics khi enroll
✅ Migration API cho enrollments cũ
✅ Admin UI để chạy migration
✅ Link trong Admin Dashboard
✅ Route protection (admin only)
✅ Error handling và logging
✅ Stats display sau migration

---

**Ngày tạo**: 2026-10-01  
**Tác giả**: Kiro AI Assistant
