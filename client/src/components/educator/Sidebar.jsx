import React, { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../../assets/assets'

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    { name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
    { name: 'Students Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon }
  ]

  return (
    <div className="md:w-72 w-16 bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-lg">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200 hidden md:block">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Educator Panel
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/educator'}
            className={({ isActive }) =>
              `flex items-center md:flex-row flex-col 
              md:justify-start justify-center py-4 md:px-6 gap-3
              border-l-4 transition-all duration-200
              ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-blue-600 text-blue-700'
                  : 'border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                    : 'bg-gray-100'
                }`}>
                  <img 
                    src={item.icon} 
                    alt={item.name} 
                    className={`w-5 h-5 ${isActive ? 'brightness-0 invert' : ''}`}
                  />
                </div>
                <span className={`md:block hidden font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 hidden md:block">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">Need Help?</p>
          <p className="text-xs text-gray-600 mb-3">Check our documentation</p>
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
            View Docs
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
