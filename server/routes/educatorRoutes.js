import express from 'express'
import { addCourse, getEducatorCourses, updateRoleToEducator, updateCourse, deleteCourse, getEducatorDashboard, getEnrolledStudents } from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router()

// Test route (no auth needed)
educatorRouter.get('/test', (req, res) => {
    res.json({ success: true, message: 'Educator API is working!' })
})

// Add educator role
educatorRouter.get('/update-role', updateRoleToEducator)

// Course management
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.put('/courses/:courseId', upload.single('image'), protectEducator, updateCourse)
educatorRouter.delete('/courses/:courseId', protectEducator, deleteCourse)

// Dashboard & Analytics
educatorRouter.get('/dashboard', protectEducator, getEducatorDashboard)
educatorRouter.get('/students', protectEducator, getEnrolledStudents)

export default educatorRouter;