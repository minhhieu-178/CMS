import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AdminSetup = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [allUsers, setAllUsers] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const users = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]')
    setAllUsers(users)
  }

  const makeAdmin = (userId) => {
    const users = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]')
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex >= 0) {
      users[userIndex].role = 'admin'
      localStorage.setItem('allRegisteredUsers', JSON.stringify(users))
      setMessage(`✅ User ${users[userIndex].name} is now an admin!`)
      loadUsers()
      
      // If current user, reload page
      if (userId === user?.id) {
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    }
  }

  const makeMeAdmin = () => {
    if (!user) {
      setMessage('❌ Please login first')
      return
    }
    makeAdmin(user.id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Setup</h1>
          <p className="text-gray-600 mb-6">Grant admin access to users</p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Quick Action: Make Me Admin */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Quick Action</h2>
            <p className="text-gray-600 mb-4">
              Current User: <span className="font-semibold">{user?.fullName || user?.firstName}</span>
              <br />
              Email: <span className="font-semibold">{user?.primaryEmailAddress?.emailAddress}</span>
            </p>
            <button
              onClick={makeMeAdmin}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              🚀 Make Me Admin
            </button>
          </div>

          {/* All Users List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">All Users</h2>
            {allUsers.length === 0 ? (
              <p className="text-gray-500">No users found. Please login first.</p>
            ) : (
              <div className="space-y-3">
                {allUsers.map((u, index) => (
                  <div
                    key={u.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {u.imageUrl && (
                        <img
                          src={u.imageUrl}
                          alt={u.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        <p className="text-xs text-gray-500">
                          Role: <span className={`font-semibold ${
                            u.role === 'admin' ? 'text-purple-600' :
                            u.role === 'educator' ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>{u.role || 'student'}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => makeAdmin(u.id)}
                      disabled={u.role === 'admin'}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        u.role === 'admin'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {u.role === 'admin' ? '✓ Admin' : 'Make Admin'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSetup
