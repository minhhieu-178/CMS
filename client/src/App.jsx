import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/student/Home'
import CourseList from './pages/student/CourseList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import PaymentSuccess from './pages/student/PaymentSuccess'
import TakeQuiz from './pages/student/TakeQuiz'
import QuizResult from './pages/student/QuizResult'
import LearningAnalytics from './pages/student/LearningAnalytics'
import MyProgress from './pages/student/MyProgress'
import DebugEnrollments from './pages/student/DebugEnrollments'
import Loading from './components/students/Loading'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import EditCourse from './pages/educator/EditCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import MigrateLocalCourses from './pages/educator/MigrateLocalCourses'
import CreateQuiz from './pages/educator/CreateQuiz'
import EditQuiz from './pages/educator/EditQuiz'
import QuizList from './pages/educator/QuizList'
import DebugQuizzes from './pages/educator/DebugQuizzes'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSetup from './pages/admin/AdminSetup'
import DebugLocalStorage from './pages/DebugLocalStorage'
import UserManagement from './pages/admin/UserManagement'
import CourseManagement from './pages/admin/CourseManagement'
import Analytics from './pages/admin/Analytics'
import Navbar from './components/students/Navbar'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import ProtectedRoute from './components/ProtectedRoute'
import RoleUpdateNotification from './components/RoleUpdateNotification'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import "quill/dist/quill.snow.css";

const App = () => {

  const location = useLocation()
  const isEducatorRoute = location.pathname.startsWith('/educator')
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isAuthRoute = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up')

  return (
    <div className='text-default min-h-screen bg-white'>
      {!isEducatorRoute && !isAdminRoute && !isAuthRoute && <Navbar/>}
      <RoleUpdateNotification />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/sign-in/*' element={<SignIn/>}/>
        <Route path='/sign-up/*' element={<SignUp/>}/>
        <Route path='/course-list' element={<CourseList/>}/>
        <Route path='/course-list/:input' element={<CourseList/>}/>
        <Route path='/course/:id' element={<CourseDetails/>}/>
        <Route path='/payment/success' element={
          <ProtectedRoute>
            <PaymentSuccess/>
          </ProtectedRoute>
        }/>
        <Route path='/my-enrollments' element={
          <ProtectedRoute>
            <MyEnrollments/>
          </ProtectedRoute>
        }/>
        <Route path='/player/:courseId' element={
          <ProtectedRoute>
            <Player/>
          </ProtectedRoute>
        }/>
        <Route path='/take-quiz/:quizId' element={
          <ProtectedRoute>
            <TakeQuiz/>
          </ProtectedRoute>
        }/>
        <Route path='/quiz-result/:attemptId' element={
          <ProtectedRoute>
            <QuizResult/>
          </ProtectedRoute>
        }/>
        <Route path='/learning-analytics' element={
          <ProtectedRoute>
            <LearningAnalytics/>
          </ProtectedRoute>
        }/>
        <Route path='/my-progress/:courseId' element={
          <ProtectedRoute>
            <MyProgress/>
          </ProtectedRoute>
        }/>
        <Route path='/loading/:path' element={<Loading/>}/>
        <Route path='/educator' element={
          <ProtectedRoute requireEducator={true}>
            <Educator/>
          </ProtectedRoute>
        }>
          <Route path='/educator' element={<Dashboard/>}/>
          <Route path='add-course' element={<AddCourse/>}/>
          <Route path='edit-course/:courseId' element={<EditCourse/>}/>
          <Route path='my-courses' element={<MyCourses/>}/>
          <Route path='student-enrolled' element={<StudentsEnrolled/>}/>
          <Route path='migrate-courses' element={<MigrateLocalCourses/>}/>
          <Route path='course/:courseId/quizzes' element={<QuizList/>}/>
          <Route path='create-quiz/:courseId' element={<CreateQuiz/>}/>
          <Route path='edit-quiz/:quizId' element={<EditQuiz/>}/>
          <Route path='debug-quizzes' element={<DebugQuizzes/>}/>
        </Route>
        
        {/* Admin Setup - No auth required */}
        <Route path='/admin/setup' element={<AdminSetup/>}/>
        
        {/* Debug LocalStorage */}
        <Route path='/debug-localstorage' element={<DebugLocalStorage/>}/>
        
        {/* Admin Routes */}
        <Route path='/admin' element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard/>
          </ProtectedRoute>
        }/>
        <Route path='/admin/users' element={
          <ProtectedRoute requireAdmin={true}>
            <UserManagement/>
          </ProtectedRoute>
        }/>
        <Route path='/admin/courses' element={
          <ProtectedRoute requireAdmin={true}>
            <CourseManagement/>
          </ProtectedRoute>
        }/>
        <Route path='/admin/analytics' element={
          <ProtectedRoute requireAdmin={true}>
            <Analytics/>
          </ProtectedRoute>
        }/>
      </Routes>
    </div>
  )
}

export default App