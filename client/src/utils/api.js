const backendUrl = import.meta.env.VITE_BACKEND_URL

// API helper function
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${backendUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// ==================== STUDENT APIs ====================

// Get user profile
export const getUserProfile = async (token) => {
  return apiRequest('/api/student/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

// Become educator
export const becomeEducator = async (token) => {
  return apiRequest('/api/student/become-educator', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

// Get all courses (public)
export const getAllCourses = async (page = 1, limit = 100, search = '') => {
  const params = new URLSearchParams({ page, limit, search })
  return apiRequest(`/api/student/courses?${params}`)
}

// Get course details (public)
export const getCourseDetails = async (courseId) => {
  return apiRequest(`/api/student/courses/${courseId}`)
}

// Get enrolled courses (protected)
export const getEnrolledCourses = async (token) => {
  return apiRequest('/api/student/my-courses', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Get student dashboard (protected)
export const getStudentDashboard = async (token) => {
  return apiRequest('/api/student/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// ==================== EDUCATOR APIs ====================

// Update role to educator
export const updateRoleToEducator = async (token) => {
  return apiRequest('/api/educator/update-role', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Add course (with file upload)
export const addCourse = async (token, courseData, imageFile) => {
  const formData = new FormData()
  formData.append('courseData', JSON.stringify(courseData))
  formData.append('image', imageFile)

  const response = await fetch(`${backendUrl}/api/educator/add-course`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })

  return response.json()
}

// Get educator courses
export const getEducatorCourses = async (token) => {
  return apiRequest('/api/educator/courses', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Update course
export const updateCourse = async (token, courseId, courseData, imageFile) => {
  const formData = new FormData()
  formData.append('courseData', JSON.stringify(courseData))
  if (imageFile) {
    formData.append('image', imageFile)
  }

  const response = await fetch(`${backendUrl}/api/educator/courses/${courseId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })

  return response.json()
}

// Delete course
export const deleteCourse = async (token, courseId) => {
  return apiRequest(`/api/educator/courses/${courseId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Get educator dashboard
export const getEducatorDashboard = async (token) => {
  return apiRequest('/api/educator/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Get enrolled students
export const getEnrolledStudents = async (token, courseId = '') => {
  const params = courseId ? `?courseId=${courseId}` : ''
  return apiRequest(`/api/educator/students${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// ==================== ENROLLMENT APIs ====================

// Enroll in course
export const enrollCourse = async (token, courseId, paymentId, amount) => {
  return apiRequest('/api/enrollment/enroll', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ courseId, paymentId, amount })
  })
}

// Check enrollment status
export const checkEnrollmentStatus = async (token, courseId) => {
  return apiRequest(`/api/enrollment/status/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Get course progress
export const getCourseProgress = async (token, courseId) => {
  return apiRequest(`/api/enrollment/progress/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Mark lecture complete
export const markLectureComplete = async (token, courseId, lectureId) => {
  return apiRequest('/api/enrollment/mark-complete', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ courseId, lectureId })
  })
}

// ==================== RATING APIs ====================

// Add rating
export const addRating = async (token, courseId, rating, review = '') => {
  return apiRequest('/api/ratings/add', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ courseId, rating, review })
  })
}

// Get course ratings (public)
export const getCourseRatings = async (courseId) => {
  return apiRequest(`/api/ratings/${courseId}`)
}

// Update rating
export const updateRating = async (token, courseId, rating, review = '') => {
  return apiRequest('/api/ratings/update', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ courseId, rating, review })
  })
}

// Delete rating
export const deleteRating = async (token, courseId) => {
  return apiRequest(`/api/ratings/${courseId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
}

// ==================== PAYMENT APIs ====================

// Create payment order
export const createPaymentOrder = async (token, courseId) => {
  return apiRequest('/api/payment/create-order', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ courseId })
  })
}

// Get payment history
export const getPaymentHistory = async (token) => {
  return apiRequest('/api/payment/history', {
    headers: { Authorization: `Bearer ${token}` }
  })
}
