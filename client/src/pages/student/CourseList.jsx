import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import SearchBar from '../../components/students/SearchBar'
import { useParams } from 'react-router-dom'
import ImprovedCourseCard from '../../components/students/ImprovedCourseCard'
import { assets } from '../../assets/assets'
import Footer from '../../components/students/Footer'
import ImprovedLoading from '../../components/students/ImprovedLoading'

const CourseList = () => {

  const {navigate, allCourses, searchCourses} = useContext(AppContext)
  const {input} = useParams()
  const [filteredCourse, setFilteredCourse] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const fetchCourses = async () => {
      if (input) {
        // Search from API when there's search input
        setLoading(true)
        const results = await searchCourses(input)
        setFilteredCourse(results)
        setLoading(false)
      } else {
        // Show dummy courses when no search
        if (allCourses && allCourses.length > 0) {
          setFilteredCourse(allCourses)
        }
      }
    }
    
    fetchCourses()
  }, [allCourses, input, searchCourses])
  
  if (loading) {
    return <ImprovedLoading />
  }
  return (
    <>
    <div className='relative md:px-36 px-8 pt-20 text-left bg-gradient-to-b from-blue-50 to-white min-h-screen'>
      <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
        <div>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>Course List</h1>
            <p className='text-gray-500 mt-2'>
            <span className='text-blue-600 cursor-pointer hover:underline'
            onClick={()=> navigate('/')}>Home</span> / <span>Course List</span></p>
        </div>
        <SearchBar data={input}/>
      </div>

      { input && <div className='inline-flex items-center gap-4 px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg mt-8 mb-8 text-gray-700'>
        <p className='font-medium'>Searching for: <span className='text-blue-600'>{input}</span></p>
        <img src={assets.cross_icon} alt="" className='cursor-pointer hover:scale-110 transition-transform' onClick={()=> navigate('/course-list/')}/>
      </div>

      }
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
      my-16 gap-6 px-2 md:p-0'>
        {filteredCourse.length > 0 ? (
          filteredCourse.map((course, index)=> <ImprovedCourseCard key={index} course={course}/>)
        ) : (
          <div className='col-span-full text-center py-20'>
            <div className='text-6xl mb-4'>🔍</div>
            <h3 className='text-2xl font-semibold text-gray-700 mb-2'>
              {input ? 'No courses found' : 'No courses available'}
            </h3>
            <p className='text-gray-500 mb-6'>
              {input 
                ? `We couldn't find any courses matching "${input}". Try a different search term.`
                : 'There are no courses available at the moment.'}
            </p>
            {input && (
              <button
                onClick={() => navigate('/course-list/')}
                className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'
              >
                View All Courses
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    <Footer/>
    </>
  )
}

export default CourseList