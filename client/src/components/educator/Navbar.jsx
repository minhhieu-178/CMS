import { assets } from '../../assets/assets';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const Navbar = () => {

  const {user} = useUser()

  return (
    <div className='flex items-center justify-between px-6 md:px-10 border-b border-gray-200 py-4 bg-white shadow-sm'>
      <Link to='/' className='flex items-center gap-3'>
        <img src={assets.logo} alt='Logo' className='w-28 lg:w-32'/>
      </Link>
      <div className='flex items-center gap-4'>
        <div className='hidden md:flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full'>
          <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
          <p className='text-sm font-medium text-gray-700'>
            Hi, <span className='font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              {user ? user.fullName : 'Educator'}
            </span>
          </p>
        </div>
        {user ? (
          <div className='flex items-center gap-3'>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10 border-2 border-blue-200 shadow-md'
                }
              }}
            />
          </div>
        ) : (
          <img className='w-10 h-10 rounded-full border-2 border-gray-200' src={assets.profile_img} alt='Profile'/>
        )} 
      </div>
    </div>
  )
}

export default Navbar