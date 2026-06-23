import express from 'express'
import { migrateEnrollmentsFromClient } from '../controllers/migrationController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const migrationRouter = express.Router()

// Migration endpoint - should be protected
migrationRouter.post('/enrollments', requireAuth, migrateEnrollmentsFromClient)

export default migrationRouter
