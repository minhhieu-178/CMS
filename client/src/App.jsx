import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/student/Home'
import CourseList from './pages/student/CourseList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import PaymentSuccess from './pages/student/PaymentSuccess'
import Loading from './components/students/Loading'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import MigrateLocalCourses from './pages/educator/MigrateLocalCourses'
import Navbar from './components/students/Navbar'
import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import "quill/dist/quill.snow.css";

const App = () => {

  const location = useLocation()
  const isEducatorRoute = location.pathname.startsWith('/educator')
  const isAuthRoute = location.pathname.startsWith('/sign-in') || location.pathname.startsWith('/sign-up')

  return (
    <div className='text-default min-h-screen bg-white'>
      {!isEducatorRoute && !isAuthRoute && <Navbar/>}
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
        <Route path='/loading/:path' element={<Loading/>}/>
        <Route path='/educator' element={
          <ProtectedRoute requireEducator={true}>
            <Educator/>
          </ProtectedRoute>
        }>
          <Route path='/educator' element={<Dashboard/>}/>
          <Route path='add-course' element={<AddCourse/>}/>
          <Route path='my-courses' element={<MyCourses/>}/>
          <Route path='student-enrolled' element={<StudentsEnrolled/>}/>
          <Route path='migrate-courses' element={<MigrateLocalCourses/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default App