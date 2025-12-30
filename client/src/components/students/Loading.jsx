import React from 'react'

const Loading = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'>
        <div className='relative'>
          {/* Outer ring */}
          <div className='w-20 h-20 border-4 border-blue-200 rounded-full animate-spin'></div>
          {/* Middle ring */}
          <div className='absolute top-2 left-2 w-16 h-16 border-4 border-purple-300 border-t-transparent rounded-full animate-spin' style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          {/* Inner ring */}
          <div className='absolute top-4 left-4 w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin' style={{animationDuration: '0.75s'}}></div>
          {/* Center dot */}
          <div className='absolute top-8 left-8 w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse'></div>
        </div>
    </div>
  )
}

export default Loading