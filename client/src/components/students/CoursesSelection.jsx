import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import ImprovedCourseCard from './ImprovedCourseCard'

const CoursesSelection = () => {

  const {allCourses} = useContext(AppContext)
  return (
    <div className='w-full px-4 md:px-36 py-16 bg-gradient-to-b from-white to-blue-50'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4'>
            Learn from the best
          </h2>
          <p className='text-base md:text-lg text-gray-600 max-w-3xl mx-auto'>
            Discover our top-rated courses across various categories. From coding and design to business and wellness, our courses are crafted to deliver results.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
          {allCourses.slice(0,4).map((course, index)=> <ImprovedCourseCard key={index} course={course}/>)}
        </div>
        
        <div className='text-center'>
          <Link to={'/course-list'} onClick={()=> scrollTo(0,0)}
          className='inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105'
          >Show all courses</Link>
        </div>
    </div>
  )
}

export default CoursesSelection