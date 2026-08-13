# Course Management System (CMS)

Hệ thống quản lý khóa học toàn diện được xây dựng với React và Node.js, cho phép giáo viên tạo và quản lý khóa học, và sinh viên đăng ký và học tập trực tuyến.

## Tính năng chính

### Dành cho Sinh viên
- Duyệt và tìm kiếm khóa học
- Đăng ký và theo dõi tiến độ học tập
- Làm bài kiểm tra và nhận chứng chỉ
- Bảng điều khiển cá nhân hóa với đề xuất thông minh
- Đánh giá và nhận xét khóa học
- Xem video bài giảng trực tuyến

### Dành cho Giáo viên
- Tạo và chỉnh sửa khóa học với trình soạn thảo rich-text
- Tải lên video và tài liệu học tập
- Tạo bài kiểm tra và câu hỏi trắc nghiệm
- Theo dõi số lượng học viên và hiệu suất khóa học
- Quản lý giá cả và thanh toán

### Dành cho Quản trị viên
- Quản lý người dùng và phân quyền
- Xem thống kê và phân tích tổng quan
- Di chuyển và quản lý dữ liệu khóa học
- Theo dõi tất cả hoạt động trong hệ thống

## Công nghệ sử dụng

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool và dev server
- **React Router** - Điều hướng ứng dụng
- **Tailwind CSS** - Styling framework
- **Clerk** - Xác thực và quản lý người dùng
- **Quill** - Rich text editor
- **React YouTube** - Tích hợp video YouTube
- **React Hot Toast** - Thông báo người dùng
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **MongoDB + Mongoose** - Database
- **Clerk Express** - Xác thực backend
- **Cloudinary** - Lưu trữ media
- **Stripe** - Xử lý thanh toán
- **Multer** - Upload file
- **Svix** - Webhook management

## Yêu cầu hệ thống

- Node.js >= 18.x
- MongoDB >= 6.x
- npm hoặc yarn

## Cài đặt và Chạy dự án

### 1. Clone repository

```bash
git clone <repository-url>
cd CMS
```

### 2. Cài đặt dependencies

#### Backend
```bash
cd server
npm install
```

#### Frontend
```bash
cd client
npm install
```

### 3. Cấu hình biến môi trường

#### Backend (.env trong thư mục server)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

#### Frontend (.env trong thư mục client)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CURRENCY=USD
VITE_BACKEND_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_USE_LOCALSTORAGE_ONLY=false
```

### 4. Chạy ứng dụng

#### Development mode

Mở 2 terminal riêng biệt:

**Terminal 1 - Backend:**
```bash
cd server
npm run server
```
Server sẽ chạy tại `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client sẽ chạy tại `http://localhost:5173`

#### Production mode

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

## Cấu trúc thư mục

```
CMS/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── assets/        # Images, icons, static files
│   │   ├── components/    # React components
│   │   │   ├── educator/  # Components cho giáo viên
│   │   │   └── students/  # Components cho sinh viên
│   │   ├── context/       # React Context API
│   │   ├── pages/         # Page components
│   │   │   ├── admin/     # Admin pages
│   │   │   ├── auth/      # Authentication pages
│   │   │   ├── educator/  # Educator pages
│   │   │   └── students/  # Student pages
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   └── package.json
│
└── server/                # Backend Node.js application
    ├── configs/           # Configuration files
    ├── controllers/       # Route controllers
    ├── middlewares/       # Express middlewares
    ├── models/           # MongoDB models
    ├── routes/           # API routes
    ├── services/         # Business logic services
    ├── server.js         # Entry point
    └── package.json
```

## Tính năng nổi bật

### Hệ thống Cá nhân hóa
- Đề xuất khóa học dựa trên sở thích và lịch sử học tập
- Theo dõi tiến độ học tập chi tiết
- Dashboard cá nhân với thống kê

### Quản lý Khóa học
- Rich text editor cho nội dung bài giảng
- Upload và quản lý video qua Cloudinary
- Tạo quiz với nhiều loại câu hỏi
- Quản lý giá cả và khuyến mãi

### Thanh toán
- Tích hợp Stripe cho thanh toán an toàn
- Hỗ trợ nhiều loại tiền tệ
- Lịch sử giao dịch chi tiết

### Bảo mật
- Xác thực với Clerk
- Phân quyền theo vai trò (Admin, Educator, Student)
- Protected routes
- Webhook verification

## Scripts hữu ích

### Client
```bash
npm run dev      # Chạy development server
npm run build    # Build cho production
npm run preview  # Preview production build
npm run lint     # Kiểm tra lỗi code
```

### Server
```bash
npm run server   # Chạy với nodemon (auto-reload)
npm start        # Chạy production server
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Đăng nhập
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/signout` - Đăng xuất

### Courses
- `GET /api/courses` - Lấy danh sách khóa học
- `GET /api/courses/:id` - Lấy chi tiết khóa học
- `POST /api/courses` - Tạo khóa học mới (Educator)
- `PUT /api/courses/:id` - Cập nhật khóa học (Educator)
- `DELETE /api/courses/:id` - Xóa khóa học (Educator)

### Enrollments
- `POST /api/enrollments` - Đăng ký khóa học
- `GET /api/enrollments/my-courses` - Lấy khóa học đã đăng ký
- `PUT /api/enrollments/:id/progress` - Cập nhật tiến độ

### Quizzes
- `GET /api/quizzes/:courseId` - Lấy quiz của khóa học
- `POST /api/quizzes` - Tạo quiz mới (Educator)
- `POST /api/quizzes/:id/submit` - Nộp bài quiz

## Đóng góp

Contributions, issues và feature requests luôn được chào đón!

## License

Dự án này được phát triển cho mục đích học tập tại HUST.

## Nhóm phát triển

Dự án được phát triển bởi sinh viên HUST

---

**Lưu ý:** Đảm bảo cấu hình đúng các biến môi trường và có kết nối MongoDB trước khi chạy ứng dụng.
