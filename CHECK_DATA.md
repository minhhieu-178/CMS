# Kiểm tra dữ liệu MongoDB

## Để xác nhận vấn đề:

### 1. Đếm số records trong các collection:

Trong MongoDB Compass hoặc shell:

```javascript
// Đếm số enrollments
db.enrollments.countDocuments()

// Đếm số learninganalytics  
db.learninganalytics.countDocuments()
```

### 2. So sánh:

Nếu:
- **enrollments** có 100 records
- **learninganalytics** chỉ có 20 records

→ Thiếu 80 LearningAnalytics records!

### 3. Tìm các enrollments thiếu analytics:

```javascript
// Lấy tất cả userId + courseId từ enrollments
const enrollments = db.enrollments.find({}, {studentId: 1, courseId: 1})

// Với mỗi enrollment, check xem có LearningAnalytics không
enrollments.forEach(e => {
  const analytics = db.learninganalytics.findOne({
    userId: e.studentId,
    courseId: e.courseId
  })
  
  if (!analytics) {
    print(`THIẾU: userId=${e.studentId}, courseId=${e.courseId}`)
  }
})
```

## Tại sao cần Migration?

### Trước đây (code cũ):
```
User đăng ký khóa học
    ↓
Tạo Enrollment ✅
    ↓
[KHÔNG tạo LearningAnalytics] ❌
```

### Bây giờ (code mới):
```
User đăng ký khóa học
    ↓
Tạo Enrollment ✅
    ↓
Tạo LearningAnalytics ✅ (đã fix)
```

### Vấn đề:
- Dữ liệu cũ: có Enrollment nhưng KHÔNG có LearningAnalytics
- Trang Analytics query từ LearningAnalytics → không thấy dữ liệu cũ

### Giải pháp:
- **Migration** = tạo các LearningAnalytics còn thiếu cho Enrollments cũ
- Chỉ cần chạy **1 lần duy nhất**
- Sau đó, enrollments mới sẽ tự động có LearningAnalytics

## Các trường hợp:

### Case 1: Database mới (chưa có enrollments)
→ **KHÔNG CẦN** migration, chỉ cần dùng code mới

### Case 2: Đã có enrollments từ trước
→ **CẦN** migration để tạo LearningAnalytics cho enrollments cũ

### Case 3: Đã chạy migration rồi
→ Chạy lại cũng OK, nó sẽ skip các records đã tồn tại

## Kiểm tra nhanh:

1. Vào MongoDB Compass
2. Mở collection `enrollments` - đếm số documents
3. Mở collection `learninganalytics` - đếm số documents
4. Nếu enrollments > learninganalytics → cần migration

## Sau khi migration:

```
enrollments.count() === learninganalytics.count()
```

Mỗi enrollment sẽ có 1 LearningAnalytics tương ứng (match bởi userId + courseId)
