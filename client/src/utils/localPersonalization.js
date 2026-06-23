// Local personalization system - works with localStorage only
import { dummyCourses } from '../assets/assets';

// Calculate learning analytics from localStorage
export const calculateLocalAnalytics = (userId) => {
  try {
    console.log('🔍 calculateLocalAnalytics called for userId:', userId);
    
    // Get data from localStorage - use correct keys
    const quizAttempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    
    // Load enrollments using the SAME logic as AppContext
    const userKey = `myEnrollments_${userId}`;
    const enrollments = JSON.parse(localStorage.getItem(userKey) || '[]');
    
    // Get courses using the SAME logic as AppContext
    let courses = [];
    
    // 1. Load from globalCourses
    try {
      const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]');
      if (globalCourses.length > 0) {
        courses = [...globalCourses];
      }
    } catch (error) {
      console.error('Error loading globalCourses:', error);
    }
    
    // 2. Load from educatorCourses_* keys
    const allKeys = Object.keys(localStorage);
    const educatorKeys = allKeys.filter(k => k.startsWith('educatorCourses_'));
    
    educatorKeys.forEach(key => {
      try {
        const educatorCourses = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(educatorCourses)) {
          // Add courses that don't exist yet (check by _id)
          const existingIds = new Set(courses.map(c => c._id));
          educatorCourses.forEach(course => {
            if (!existingIds.has(course._id)) {
              courses.push(course);
              existingIds.add(course._id);
            }
          });
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      }
    });
    
    // 3. Add dummy courses (like AppContext does)
    const existingIds = new Set(courses.map(c => c._id));
    dummyCourses.forEach(course => {
      if (!existingIds.has(course._id)) {
        courses.push(course);
      }
    });
    
    console.log('📦 Raw data:', {
      quizAttempts: quizAttempts.length,
      enrollments: enrollments.length,
      courses: courses.length,
      enrollmentCourseIds: enrollments.map(e => e.courseId).slice(0, 5),
      availableCourseIds: courses.map(c => c._id).slice(0, 5)
    });
    
    // Filter user's data
    const userAttempts = quizAttempts.filter(a => a.userId === userId);
    
    // Enrollments are already user-specific (loaded from myEnrollments_${userId})
    const userEnrollments = enrollments;
    
    console.log('👤 User data:', {
      userAttempts: userAttempts.length,
      userEnrollments: userEnrollments.length,
      sampleEnrollment: userEnrollments[0],
      sampleEnrollmentCourseId: userEnrollments[0]?.courseId
    });
    
    // Group by course
    const courseAnalytics = {};
    
    console.log('🔄 Processing enrollments:', userEnrollments.length);
    
    userEnrollments.forEach((enrollment, index) => {
      console.log(`📝 Processing enrollment ${index + 1}:`, {
        courseId: enrollment.courseId,
        studentId: enrollment.studentId
      });
      
      const course = courses.find(c => c._id === enrollment.courseId);
      
      if (!course) {
        console.warn(`⚠️ Course not found for enrollment:`, enrollment.courseId);
        return;
      }
      
      console.log(`✅ Found course:`, course.courseTitle);
      
      const courseId = enrollment.courseId;
      
      // Get quiz attempts for this course
      const allQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const courseQuizzes = allQuizzes.filter(q => q.courseId === courseId);
      
      console.log(`📝 Course ${course.courseTitle}:`, {
        allQuizzesCount: allQuizzes.length,
        courseQuizzesCount: courseQuizzes.length,
        courseQuizIds: courseQuizzes.map(q => q._id)
      });
      
      const courseQuizIds = courseQuizzes.map(q => q._id);
      const courseAttempts = userAttempts.filter(a => courseQuizIds.includes(a.quizId));
      
      console.log(`📊 Quiz attempts for ${course.courseTitle}:`, {
        totalAttempts: courseAttempts.length,
        attempts: courseAttempts.map(a => ({
          quizId: a.quizId,
          score: a.score,
          percentage: a.percentage
        }))
      });
      
      // Calculate statistics
      const totalLectures = course.courseContent.reduce(
        (sum, ch) => sum + ch.chapterContent.length, 
        0
      );
      
      // Load completed lectures from the correct localStorage key
      const completedLecturesKey = `completedLectures_${courseId}`;
      const completedLecturesData = localStorage.getItem(completedLecturesKey);
      const completedLecturesArray = completedLecturesData ? JSON.parse(completedLecturesData) : [];
      const completedLectures = completedLecturesArray.length;
      
      const progressPercentage = totalLectures > 0 
        ? Math.round((completedLectures / totalLectures) * 100) 
        : 0;
      
      console.log(`📈 Progress for ${course.courseTitle}:`, {
        completedLectures,
        totalLectures,
        progressPercentage
      });
      
      // Calculate quiz performance
      let averageScore = 0;
      let totalQuizzes = courseAttempts.length;
      
      if (totalQuizzes > 0) {
        // Calculate percentage - handle both string and number formats
        const totalPercentage = courseAttempts.reduce((sum, a) => {
          let percentage = parseFloat(a.percentage) || 0;
          
          // If percentage is still 0 or NaN, try to calculate from score
          if (!percentage && a.score !== undefined && a.totalPoints !== undefined && a.totalPoints > 0) {
            percentage = (a.score / a.totalPoints) * 100;
          }
          
          return sum + percentage;
        }, 0);
        
        averageScore = (totalPercentage / totalQuizzes) / 10; // Convert to 0-10 scale
        
        console.log(`📊 Score calculation for ${course.courseTitle}:`, {
          totalPercentage,
          totalQuizzes,
          averageScore: averageScore.toFixed(1)
        });
      }
      
      // Determine learning level
      let learningLevel = 'beginner';
      if (averageScore >= 8) learningLevel = 'advanced';
      else if (averageScore >= 5) learningLevel = 'intermediate';
      
      // Count retakes
      const quizRetakeCount = courseAttempts.length - new Set(courseAttempts.map(a => a.quizId)).size;
      
      // Get recent attempts
      const recentAttempts = courseAttempts
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 5)
        .map(a => ({
          score: a.score,
          totalQuestions: a.totalPoints,
          percentage: a.percentage,
          attemptDate: a.submittedAt
        }));
      
      courseAnalytics[courseId] = {
        courseId,
        courseTitle: course.courseTitle,
        courseThumbnail: course.courseThumbnail,
        coursePrice: course.coursePrice,
        
        progress: {
          completedLectures,
          totalLectures,
          percentage: progressPercentage
        },
        
        quizPerformance: {
          averageScore: averageScore.toFixed(1),
          totalQuizzes,
          retakeCount: quizRetakeCount,
          recentAttempts
        },
        
        learningLevel,
        
        lastAccessed: enrollment.enrollmentDate
      };
    });
    
    // Calculate overall summary
    const allCourses = Object.values(courseAnalytics);
    const totalCourses = allCourses.length;
    const totalQuizzes = allCourses.reduce((sum, c) => sum + c.quizPerformance.totalQuizzes, 0);
    
    // Only calculate average from courses that have quizzes
    const coursesWithQuizzes = allCourses.filter(c => c.quizPerformance.totalQuizzes > 0);
    const averageScore = coursesWithQuizzes.length > 0
      ? coursesWithQuizzes.reduce((sum, c) => sum + parseFloat(c.quizPerformance.averageScore), 0) / coursesWithQuizzes.length
      : 0;
    
    const averageProgress = totalCourses > 0
      ? allCourses.reduce((sum, c) => sum + c.progress.percentage, 0) / totalCourses
      : 0;
    
    const result = {
      success: true,
      summary: {
        totalCourses,
        totalQuizzes,
        averageScore: averageScore.toFixed(1),
        averageProgress: Math.round(averageProgress)
      },
      analytics: allCourses
    };
    
    console.log('✅ Final analytics result:', {
      totalCourses,
      totalQuizzes,
      averageScore: averageScore.toFixed(1),
      averageProgress: Math.round(averageProgress),
      coursesCount: allCourses.length
    });
    
    return result;
    
  } catch (error) {
    console.error('Error calculating local analytics:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Get personalized dashboard for a specific course
export const getLocalPersonalizedDashboard = (userId, courseId) => {
  try {
    const analytics = calculateLocalAnalytics(userId);
    
    if (!analytics.success) {
      return { success: false, message: analytics.message };
    }
    
    const courseData = analytics.analytics.find(a => a.courseId === courseId);
    
    if (!courseData) {
      return {
        success: false,
        message: 'No data found for this course'
      };
    }
    
    // Get course details using same logic as AppContext
    let courses = [];
    
    // Load from globalCourses
    try {
      const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]');
      if (globalCourses.length > 0) {
        courses = [...globalCourses];
      }
    } catch (error) {
      console.error('Error loading globalCourses:', error);
    }
    
    // Load from educatorCourses_*
    const allKeys = Object.keys(localStorage);
    const educatorKeys = allKeys.filter(k => k.startsWith('educatorCourses_'));
    
    educatorKeys.forEach(key => {
      try {
        const educatorCourses = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(educatorCourses)) {
          const existingIds = new Set(courses.map(c => c._id));
          educatorCourses.forEach(course => {
            if (!existingIds.has(course._id)) {
              courses.push(course);
            }
          });
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      }
    });
    
    // Add dummy courses
    const existingIds = new Set(courses.map(c => c._id));
    dummyCourses.forEach(course => {
      if (!existingIds.has(course._id)) {
        courses.push(course);
      }
    });
    
    const course = courses.find(c => c._id === courseId);
    
    if (!course) {
      return { success: false, message: 'Course not found' };
    }
    
    // Find next lesson
    const userKey = `myEnrollments_${userId}`;
    const enrollments = JSON.parse(localStorage.getItem(userKey) || '[]');
    const enrollment = enrollments.find(e => e.courseId === courseId);
    
    // Load completed lectures from the correct localStorage key
    const completedLecturesKey = `completedLectures_${courseId}`;
    const completedLecturesData = localStorage.getItem(completedLecturesKey);
    const completedLecturesArray = completedLecturesData ? JSON.parse(completedLecturesData) : [];
    
    let nextLesson = null;
    if (enrollment && course.courseContent.length > 0) {
      // Find first incomplete lecture
      for (const chapter of course.courseContent) {
        for (const lecture of chapter.chapterContent) {
          if (!completedLecturesArray.includes(lecture.lectureId)) {
            nextLesson = {
              title: lecture.lectureTitle,
              duration: lecture.lectureDuration,
              chapterId: chapter.chapterId
            };
            break;
          }
        }
        if (nextLesson) break;
      }
    }
    
    return {
      success: true,
      dashboard: {
        ...courseData,
        nextLesson
      }
    };
    
  } catch (error) {
    console.error('Error getting personalized dashboard:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Get course recommendations based on learning level
export const getLocalCourseRecommendations = (userId, currentCourseId) => {
  try {
    const analytics = calculateLocalAnalytics(userId);
    
    if (!analytics.success) {
      return { success: false, message: analytics.message };
    }
    
    const courseData = analytics.analytics.find(a => a.courseId === currentCourseId);
    
    if (!courseData) {
      return { success: false, recommendedCourses: [] };
    }
    
    const level = courseData.learningLevel;
    const averageScore = parseFloat(courseData.quizPerformance.averageScore);
    
    // Get all courses using same logic as AppContext
    let allCourses = [];
    
    // Load from globalCourses
    try {
      const globalCourses = JSON.parse(localStorage.getItem('globalCourses') || '[]');
      if (globalCourses.length > 0) {
        allCourses = [...globalCourses];
      }
    } catch (error) {
      console.error('Error loading globalCourses:', error);
    }
    
    // Load from educatorCourses_*
    const allKeys = Object.keys(localStorage);
    const educatorKeys = allKeys.filter(k => k.startsWith('educatorCourses_'));
    
    educatorKeys.forEach(key => {
      try {
        const educatorCourses = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(educatorCourses)) {
          const existingIds = new Set(allCourses.map(c => c._id));
          educatorCourses.forEach(course => {
            if (!existingIds.has(course._id)) {
              allCourses.push(course);
            }
          });
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
      }
    });
    
    // Add dummy courses
    const existingIds = new Set(allCourses.map(c => c._id));
    dummyCourses.forEach(course => {
      if (!existingIds.has(course._id)) {
        allCourses.push(course);
      }
    });
    
    const currentCourse = allCourses.find(c => c._id === currentCourseId);
    
    if (!currentCourse) {
      return { success: false, recommendedCourses: [] };
    }
    
    // Get enrolled course IDs
    const userKey = `myEnrollments_${userId}`;
    const enrollments = JSON.parse(localStorage.getItem(userKey) || '[]');
    const enrolledCourseIds = enrollments.map(e => e.courseId);
    
    // Filter and recommend courses
    let recommendedCourses = [];
    
    if (level === 'beginner' || averageScore < 50) {
      // Recommend basic/cheaper courses
      recommendedCourses = allCourses.filter(c => 
        c._id !== currentCourseId &&
        !enrolledCourseIds.includes(c._id) &&
        c.coursePrice <= currentCourse.coursePrice
      );
    } else if (level === 'intermediate') {
      // Recommend similar level courses
      recommendedCourses = allCourses.filter(c => 
        c._id !== currentCourseId &&
        !enrolledCourseIds.includes(c._id) &&
        c.coursePrice >= currentCourse.coursePrice * 0.8 &&
        c.coursePrice <= currentCourse.coursePrice * 1.5
      );
    } else {
      // Recommend advanced/expensive courses
      recommendedCourses = allCourses.filter(c => 
        c._id !== currentCourseId &&
        !enrolledCourseIds.includes(c._id) &&
        c.coursePrice >= currentCourse.coursePrice
      );
    }
    
    // Limit to 5 recommendations
    recommendedCourses = recommendedCourses.slice(0, 5);
    
    return {
      success: true,
      level,
      averageScore,
      recommendedCourses
    };
    
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return {
      success: false,
      message: error.message,
      recommendedCourses: []
    };
  }
};

// Analyze quiz performance and get recommendations
export const analyzeLocalQuizPerformance = (score, totalQuestions) => {
  const percentage = (score / totalQuestions) * 100;
  
  let recommendation = {
    level: '',
    action: '',
    message: '',
    nextSteps: []
  };
  
  if (percentage < 50) {
    recommendation = {
      level: 'needs_improvement',
      action: 'review',
      message: 'Bạn cần ôn tập lại kiến thức cơ bản',
      nextSteps: [
        'Xem lại bài giảng',
        'Làm bài tập cơ bản thêm',
        'Tham khảo tài liệu bổ sung',
        'Học lại từ đầu chương này'
      ],
      suggestEasierContent: true
    };
  } else if (percentage >= 50 && percentage <= 80) {
    recommendation = {
      level: 'good',
      action: 'continue',
      message: 'Bạn đang học tốt, hãy tiếp tục!',
      nextSteps: [
        'Tiếp tục bài học tiếp theo',
        'Ôn tập thêm để nắm vững',
        'Làm thêm bài tập nâng cao'
      ],
      suggestReview: true
    };
  } else {
    recommendation = {
      level: 'excellent',
      action: 'advance',
      message: 'Xuất sắc! Bạn đã nắm vững kiến thức',
      nextSteps: [
        'Chuyển sang bài học nâng cao',
        'Thử thách với nội dung khó hơn',
        'Khám phá khóa học liên quan'
      ],
      unlockNextLesson: true,
      suggestAdvancedContent: true
    };
  }
  
  return recommendation;
};
