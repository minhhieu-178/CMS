import React, { useContext } from 'react'
import {assets} from '../../assets/assets'
import { Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { AppContext } from '../../context/AppContext'

const Navbar = () => {

  const {navigate, isEducator, becomeEducator, fetchUserProfile} = useContext(AppContext)

  const isCourseListPage = location.pathname.includes('/course-list');

  const {user} = useUser()

  const handleBecomeEducator = async () => {
    if (isEducator) {
      navigate('/educator')
    } else {
      // Create custom modal instead of browser confirm
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in'
      modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-fade-in-up">
          <div class="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 text-center mb-3">Become an Educator</h2>
          <p class="text-gray-600 text-center mb-6">
            Start sharing your knowledge with students worldwide. Create and manage your own courses.
          </p>
          <div class="space-y-3 mb-6">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm text-gray-700">Create unlimited courses</span>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm text-gray-700">Manage students and enrollments</span>
            </div>
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm text-gray-700">Access educator dashboard</span>
            </div>
          </div>
          <div class="flex gap-3">
            <button id="cancelBtn" class="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button id="confirmBtn" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
              Continue
            </button>
          </div>
        </div>
      `
      document.body.appendChild(modal)

      const handleConfirm = async () => {
        document.body.removeChild(modal)
        
        // Show loading toast
        const loadingToast = document.createElement('div')
        loadingToast.className = 'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-fade-in-right bg-blue-500'
        loadingToast.innerHTML = '<div class="flex items-center gap-2"><div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Processing...</span></div>'
        document.body.appendChild(loadingToast)
        
        const result = await becomeEducator()
        
        // Remove loading toast
        if (document.body.contains(loadingToast)) {
          document.body.removeChild(loadingToast)
        }
        
        // Wait a bit for backend to sync
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Force reload profile
        await fetchUserProfile()
        
        // Show success/error message
        const toast = document.createElement('div')
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-fade-in-right ${
          result.success ? 'bg-green-500' : 'bg-red-500'
        }`
        toast.textContent = result.message || (result.success ? 'Success!' : 'Failed')
        document.body.appendChild(toast)
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 3000)
      }

      const handleCancel = () => {
        document.body.removeChild(modal)
      }

      modal.querySelector('#confirmBtn').addEventListener('click', handleConfirm)
      modal.querySelector('#cancelBtn').addEventListener('click', handleCancel)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) handleCancel()
      })
    }
  }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14
    lg:px-36 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
        <img onClick={()=> navigate('/')} src={assets.logo} alt="Logo" className='w-28 lg:w-32
        cursor-pointed' />
        <div className='hidden md:flex items-center gap-5 text-gray-500'>
            <div className='flex items-center gap-5'>

              { user &&
              <>
                <button onClick={handleBecomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
                | <Link to='/my-enrollments'>My Enrollments</Link>
              </>
                }
             </div>
            { user ? <UserButton/> :
             <div className='flex items-center gap-3'>
               <button onClick={()=> navigate('/sign-in')} className='text-gray-700 hover:text-blue-600 font-medium transition-colors'>
                 Sign In
               </button>
               <button onClick={()=> navigate('/sign-up')} className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all'>
                 Get Started
               </button>
             </div>
            }
        </div>
        {/*For Phone screen*/}
        <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
          <div className='flex items-center gap-1 sm:gap-2 max-sm:text-xs'>
            { user &&
              <>
                <button onClick={handleBecomeEducator}>{isEducator ? 'Educator Dashboard' : 'Become Educator'}</button>
                | <Link to='/my-enrollments'>My Enrollments</Link>
              </>
                }
          </div>
          {
            user ? <UserButton/> 
            :  <button onClick={()=> navigate('/sign-in')} className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md'>
                 Sign In
               </button>
          }
        </div>
    </div>
  )
}

export default Navbar