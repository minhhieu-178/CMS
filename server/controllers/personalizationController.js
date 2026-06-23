import PersonalizationService from '../services/personalizationService.js';
import LearningAnalytics from '../models/LearningAnalytics.js';
import Course from '../models/Course.js';

// Get personalized dashboard
export const getPersonalizedDashboard = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.params;
    
    const result = await PersonalizationService.getPersonalizedDashboard(userId, courseId);
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get course recommendations
export const getCourseRecommendations = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.params;
    
    const result = await PersonalizationService.recommendCourses(userId, courseId);
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Check if can access next lesson
export const checkLessonAccess = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, lectureId } = req.params;
    
    const result = await PersonalizationService.canAccessNextLesson(userId, courseId, lectureId);
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update lecture progress
export const updateLectureProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, lectureId, chapterId } = req.body;
    
    const result = await PersonalizationService.updateLectureProgress(
      userId, 
      courseId, 
      lectureId, 
      chapterId
    );
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get learning analytics
export const getLearningAnalytics = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.params;
    
    const analytics = await LearningAnalytics.findOne({ userId, courseId })
      .populate('courseId', 'courseTitle courseThumbnail');
    
    if (!analytics) {
      return res.json({ 
        success: false, 
        message: 'No analytics data found' 
      });
    }
    
    res.json({ success: true, analytics });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all user analytics (for student dashboard)
export const getAllUserAnalytics = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    console.log('📊 Loading analytics for user:', userId);
    
    const allAnalytics = await LearningAnalytics.find({ userId })
      .populate('courseId') // Populate all course fields including courseContent
      .populate('recommendations.suggestedCourses', 'courseTitle courseThumbnail coursePrice courseDescription courseRatings enrolledStudents educator');
    
    console.log('📚 Found', allAnalytics.length, 'enrolled courses');
    
    // Recalculate progress for each course with quiz validation
    const Quiz = (await import('../models/Quiz.js')).default;
    
    for (const analytics of allAnalytics) {
      if (!analytics.courseId) continue;
      
      const course = analytics.courseId;
      
      // Check if courseContent exists
      if (!course.courseContent || course.courseContent.length === 0) {
        console.log(`⚠️ Course ${course._id} has no content, skipping recalculation`);
        continue;
      }
      
      const totalLectures = course.courseContent.reduce(
        (sum, ch) => sum + (ch.chapterContent?.length || 0), 
        0
      );
      
      // Load quizzes for this course
      const allQuizzes = await Quiz.find({ courseId: course._id, isActive: true });
      
      // Build a map: lectureId -> quizId
      const lectureQuizMap = new Map();
      for (const quiz of allQuizzes) {
        const chapter = course.courseContent[quiz.chapterIndex];
        if (chapter && chapter.chapterContent && chapter.chapterContent[quiz.lectureIndex]) {
          const lecture = chapter.chapterContent[quiz.lectureIndex];
          lectureQuizMap.set(lecture.lectureId, quiz._id.toString());
        }
      }
      
      // Count truly completed lectures (with quiz validation)
      let trulyCompletedCount = 0;
      
      for (const lectureId of analytics.progress.completedLectures) {
        const quizId = lectureQuizMap.get(lectureId);
        
        if (quizId) {
          // Lecture has quiz - check if passed
          const quizAttempts = analytics.quizAttempts.filter(
            a => a.quizId && a.quizId.toString() === quizId
          );
          
          // Find best attempt
          const bestAttempt = quizAttempts.reduce((best, current) => {
            return (current.percentage > (best?.percentage || 0)) ? current : best;
          }, null);
          
          // Get quiz passing score
          const quiz = allQuizzes.find(q => q._id.toString() === quizId);
          const passingScore = quiz?.settings?.passingScore || 70;
          
          if (bestAttempt && bestAttempt.percentage >= passingScore) {
            trulyCompletedCount++;
            console.log(`   ✅ ${lectureId}: Completed + Quiz Passed (${bestAttempt.percentage}%)`);
          } else {
            console.log(`   ⚠️  ${lectureId}: Marked complete but quiz not passed yet`);
          }
        } else {
          // No quiz required - just completed is enough
          trulyCompletedCount++;
          console.log(`   ✅ ${lectureId}: Completed (no quiz)`);
        }
      }
      
      // Recalculate progress percentage with quiz validation
      const recalculatedProgress = totalLectures > 0
        ? Math.round((trulyCompletedCount / totalLectures) * 100)
        : 0;
      
      console.log(`📊 Course ${course.courseTitle}: ${trulyCompletedCount}/${totalLectures} truly completed = ${recalculatedProgress}%`);
      
      // Update the overallProgress in memory (for response)
      analytics.progress.overallProgress = recalculatedProgress;
      
      // Optionally save to DB to keep it updated
      try {
        await LearningAnalytics.findByIdAndUpdate(analytics._id, {
          'progress.overallProgress': recalculatedProgress
        });
      } catch (updateError) {
        console.error('⚠️ Could not update progress in DB:', updateError.message);
      }
    }
    
    // Calculate overall statistics
    const totalCourses = allAnalytics.length;
    const totalQuizzes = allAnalytics.reduce(
      (sum, a) => sum + a.learningPattern.totalQuizzesTaken, 
      0
    );
    
    const averageScore = allAnalytics.length > 0
      ? allAnalytics.reduce(
          (sum, a) => sum + a.learningPattern.averageQuizScore, 
          0
        ) / allAnalytics.length
      : 0;
    
    const averageProgress = allAnalytics.length > 0
      ? allAnalytics.reduce(
          (sum, a) => sum + a.progress.overallProgress, 
          0
        ) / allAnalytics.length
      : 0;
    
    // Generate recommendations if needed
    for (const analytics of allAnalytics) {
      // Skip if courseId is null
      if (!analytics.courseId) continue;
      
      // If no recommendations or old recommendations (> 7 days)
      const lastUpdated = analytics.recommendations?.lastUpdated;
      const daysSinceUpdate = lastUpdated 
        ? (Date.now() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24)
        : 999;
      
      if (!analytics.recommendations?.suggestedCourses?.length || daysSinceUpdate > 7) {
        try {
          // Auto-generate recommendations
          await PersonalizationService.recommendCourses(userId, analytics.courseId._id);
          
          // Reload with populated data
          const updated = await LearningAnalytics.findById(analytics._id)
            .populate('courseId')
            .populate('recommendations.suggestedCourses', 'courseTitle courseThumbnail coursePrice courseDescription courseRatings enrolledStudents educator');
          
          // Replace in array
          const index = allAnalytics.findIndex(a => a._id.toString() === analytics._id.toString());
          if (index !== -1 && updated) {
            allAnalytics[index] = updated;
          }
        } catch (recError) {
          console.error('⚠️ Could not generate recommendations:', recError.message);
        }
      }
    }
    
    res.json({
      success: true,
      summary: {
        totalCourses,
        totalQuizzes,
        averageScore: averageScore.toFixed(1),
        averageProgress: Math.round(averageProgress)
      },
      analytics: allAnalytics
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Analyze quiz and get recommendations (called after quiz completion)
export const analyzeQuizPerformance = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, quizId, attemptId, score, totalQuestions, timeSpent } = req.body;
    
    const result = await PersonalizationService.updateAnalyticsAfterQuiz(
      userId,
      courseId,
      quizId,
      attemptId,
      score,
      totalQuestions,
      timeSpent || 0
    );
    
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
