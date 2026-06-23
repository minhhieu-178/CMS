import { clerkClient } from "@clerk/express";

// Middleware (Require authentication)
export const requireAuth = async (req, res, next) => {
    try {
        if (!req.auth || !req.auth.userId) {
            return res.json({ success: false, message: 'Unauthorized - Please login' })
        }
        next()
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Middleware (Protect educator routes)
export const protectEducator = async (req, res, next)=>{
    try {
        console.log('🔐 protectEducator middleware')
        console.log('req.auth:', req.auth)
        
        if (!req.auth || !req.auth.userId) {
            console.log('❌ No auth or userId')
            return res.json({success:false, message: 'Unauthorized - No authentication'})
        }
        
        const userId = req.auth.userId
        console.log('✅ userId:', userId)
        
        const response = await clerkClient.users.getUser(userId)
        console.log('👤 User role:', response.publicMetadata.role)

        if(response.publicMetadata.role !== 'educator' && response.publicMetadata.role !== 'admin'){
            console.log('❌ Not educator or admin')
            return res.json({success:false, message: 'Unauthorized Access - Not an educator'})
        }

        console.log('✅ Educator verified')
        next()

    } catch (error) {
        console.error('❌ protectEducator error:', error)
        res.json({success:false, message: error.message})
    }
}