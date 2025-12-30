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
        const userId = req.auth.userId
        const response = await clerkClient.users.getUser(userId)

        if(response.publicMetadata.role !== 'educator'){
            return res.json({success:false, message: 'Unauthorized Access'})
        }

        next()

    } catch (error) {
        res.json({success:false, message: error.message})
    }
}