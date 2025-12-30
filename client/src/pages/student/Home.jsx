import React from 'react'
import ImprovedHero from '../../components/students/ImprovedHero'
import Companies from '../../components/students/Companies'
import CoursesSelection from '../../components/students/CoursesSelection'
import TestimonialsSection from '../../components/students/TestimonialsSection'
import CallToAction from '../../components/students/CallToAction'
import Footer from '../../components/students/Footer'

const Home = () => {
  return (
    <div className='flex flex-col items-center space-y-7 text-center'>
        <ImprovedHero />
        <Companies/>
        <CoursesSelection/>
        <TestimonialsSection/>
        <CallToAction/>
        <Footer/>
    </div>
  )
}

export default Home