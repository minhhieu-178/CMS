export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Chưa xác thực' 
            })
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        })

        res.json({ success: true, message: 'Bạn đã có thể xuất bản khóa học' })

    } catch (error) {
        console.error('Lỗi khi cập nhật vai trò:', error)
        res.status(500).json({ 
            success: false, 
            message: 'Không thể cập nhật vai trò' 
        })
    }
}