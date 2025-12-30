import React from 'react'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div>
       <footer className='bg-gray-900 md:px-36 text-left w-full mt-10'>
          <div className='flex flex-col md:flex-row items-start px-8
          md:px-36 justify-center gap-10 md:gap-32 py-10 border-b
          border-white/30'>
            <div className='flex flex-col md:items-start items-center
            w-full'>
              <img src={assets.logo_dark} alt="logo"/>
              <p className='mt-6 text-center md:text-left text-sm text-white/80'>Lorem Ipsum is simply dummy text of printing and
              typesetting industry. Lorem Ipsum has been the
              industry's standard dummy text.
              </p>
            </div>
            <div className='flex flex-col md:items-start items-center w-full'>
              <h2 className='font-semibold text-white mb-5'>Company</h2>
              <ul className='flex md:flex-col w-full justify-between text-sm text-white/80 md:space-y-2'>
                <li><a href="#">Home</a></li>
                <li><a href="#"></a>About us</li>
                <li><a href="#"></a>Contact us</li>
                <li><a href="#"></a>Privacy policy</li>
              </ul>
            </div>
            <div className='hidden md:flex flex-col items-start w-full'>
              <h2 className='font-semibold text-white mb-5'>Subscribe to our newsletter</h2>
              <p className='text-sm text-white/80'>The lastest news, articles, and resources, sent to your inbox weekly.</p>
              <div>
                <input type="email" placeholder='Enter your email' 
                className='border border-gray-500/30 bg-gray-800 text-gray-500 placeholder-gray-500 outline-none w-64 h-9 rounded px-2 text-sm'/>
                <button className='bg-blue-600 w-24 h-9 text-white rounded'>Subscribe</button>
              </div>
            </div>

          </div>
        
        </footer>
    </div>
  )
}

export default Footer