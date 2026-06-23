import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { AppContext } from '../context/AppContext'

const ProtectedRoute = ({ children, requireEducator = false, requireAdmin = false }) => {
  const { user, isLoaded } = useUser()
  const { isEducator, userRole } = useContext(AppContext)
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  // Check role from multiple sources (LocalStorage is source of truth)
  const getUserRole = () => {
    if (!user) return 'guest'
    
    // Check LocalStorage first (source of truth)
    const allUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]')
    const userInStorage = allUsers.find(u => u.id === user.id)
    if (userInStorage?.role) {
      console.log('🔑 Role from LocalStorage:', userInStorage.role)
      return userInStorage.role
    }
    
    // Fallback to Clerk metadata
    const clerkRole = user.unsafeMetadata?.role || user.publicMetadata?.role || 'student'
    console.log('🔑 Role from Clerk:', clerkRole)
    return clerkRole
  }

  const currentRole = getUserRole()
  const isAdmin = currentRole === 'admin'
  const isEducatorRole = currentRole === 'educator' || isAdmin

  useEffect(() => {
    if (isLoaded) {
      // If not logged in, redirect to sign-in
      if (!user) {
        navigate('/sign-in')
        return
      }

      // If admin route but user is not admin
      if (requireAdmin && !isAdmin) {
        console.log('Access denied: Admin role required. Current role:', currentRole)
        
        const toast = document.createElement('div')
        toast.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-fade-in-right bg-red-500'
        toast.textContent = 'Bạn cần quyền Admin để truy cập trang này'
        document.body.appendChild(toast)
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 3000)
        
        navigate('/')
        return
      }

      // If educator route but user is not educator (and not admin)
      if (requireEducator && !isEducatorRole) {
        console.log('Access denied: Educator role required. Current role:', currentRole)
        
        const toast = document.createElement('div')
        toast.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-fade-in-right bg-red-500'
        toast.textContent = 'You need to be an educator to access this page'
        document.body.appendChild(toast)
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 3000)
        
        navigate('/')
        return
      }

      setChecking(false)
    }
  }, [user, isLoaded, isEducator, userRole, requireEducator, requireAdmin, isAdmin, navigate])

  // Show loading while checking auth
  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className='relative'>
          <div className='w-20 h-20 border-4 border-blue-200 rounded-full animate-spin'></div>
          <div className='absolute top-2 left-2 w-16 h-16 border-4 border-purple-300 border-t-transparent rounded-full animate-spin' style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          <div className='absolute top-4 left-4 w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin' style={{animationDuration: '0.75s'}}></div>
          <div className='absolute top-8 left-8 w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse'></div>
        </div>
      </div>
    )
  }

  // If not authenticated or not authorized, don't render children
  if (!user || (requireEducator && !isEducatorRole) || (requireAdmin && !isAdmin)) {
    return null
  }

  return children
}

export default ProtectedRoute
