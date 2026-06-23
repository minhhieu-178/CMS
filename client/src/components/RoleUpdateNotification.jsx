import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-toastify'

const RoleUpdateNotification = () => {
  const { user } = useUser()
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (!user || hasChecked) return

    const checkRoleUpdate = async () => {
      try {
        // Check if there's a notification for this user
        const notifications = JSON.parse(localStorage.getItem('userNotifications') || '{}')
        const userNotification = notifications[user.id]

        if (userNotification && !userNotification.read && userNotification.type === 'educator_approved') {
          // Mark as read
          notifications[user.id].read = true
          localStorage.setItem('userNotifications', JSON.stringify(notifications))

          // Check if role needs to be synced
          const allUsers = JSON.parse(localStorage.getItem('allRegisteredUsers') || '[]')
          const userInStorage = allUsers.find(u => u.id === user.id)

          if (userInStorage && userInStorage.role === 'educator') {
            const currentClerkRole = user.publicMetadata?.role || 'student'

            if (currentClerkRole !== 'educator') {
              // Show notification and reload
              toast.success(
                '🎉 Chúc mừng! Bạn đã được phê duyệt làm Giảng viên!\n\nĐang cập nhật quyền...',
                {
                  autoClose: 2000,
                  onClose: () => {
                    // Force reload to sync role
                    window.location.reload()
                  }
                }
              )
            } else {
              // Role already synced
              toast.success('🎉 Chúc mừng! Bạn đã trở thành Giảng viên!', {
                autoClose: 3000
              })
            }
          }
        }

        setHasChecked(true)
      } catch (error) {
        console.error('Error checking role update:', error)
        setHasChecked(true)
      }
    }

    // Check after a short delay to ensure user is fully loaded
    const timer = setTimeout(checkRoleUpdate, 1000)
    return () => clearTimeout(timer)
  }, [user, hasChecked])

  return null // This is a notification-only component
}

export default RoleUpdateNotification
