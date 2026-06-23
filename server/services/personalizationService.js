import LearningAnalytics from '../models/LearningAnalytics.js';
import Course from '../models/Course.js';
import QuizAttempt from '../models/QuizAttempt.js';

class PersonalizationService {
  
  // Phân tích điểm quiz và đưa ra gợi ý
  static analyzeQuizPerformance(score, totalQuestions) {
    const percentage = (score / totalQuestions) * 100; // Percentage 0-100
    
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
  }
  
  // Tính toán learning level dựa trên điểm trung bình (percentage 0-100)
  static calculateLearningLevel(averageScore) {
    if (averageScore < 50) return 'beginner';
    if (averageScore >= 50 && averageScore <= 80) return 'intermediate';
    return 'advanced';
  }
  
  // Cập nhật analytics sau mỗi lần làm quiz
  static async updateAnalyticsAfterQuiz(userId, courseId, quizId, attemptId, score, totalPoints, timeSpent) {
    try {
      // Calculate percentage from score and totalPoints
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0; // Percentage 0-100
      
      let analytics = await LearningAnalytics.findOne({ userId, courseId });
      
      if (!analytics) {
        analytics = new LearningAnalytics({
          userId,
          courseId,
          quizAttempts: [],
          progress: {
            completedLectures: [],
            overallProgress: 0
          },
          learningPattern: {
            averageQuizScore: 0,
            totalQuizzesTaken: 0,
            quizRetakeCount: 0,
            weakTopics: [],
            strongTopics: []
          }
        });
      }
      
      // Check if retake
      const previousAttempt = analytics.quizAttempts.find(
        a => a.quizId.toString() === quizId.toString()
      );
      
      if (previousAttempt) {
        analytics.learningPattern.quizRetakeCount += 1;
      }
      
      // Add new attempt
      analytics.quizAttempts.push({
        quizId,
        attemptId,
        score,
        totalQuestions: totalPoints, // Store totalPoints as totalQuestions for consistency
        percentage,
        attemptDate: new Date(),
        timeSpent
      });
      
      // Update learning pattern - use BEST (highest) score instead of average
      // Group attempts by quizId to get best score per quiz
      const quizBestScores = new Map();
      
      analytics.quizAttempts.forEach(attempt => {
        const quizId = attempt.quizId.toString();
        const currentBest = quizBestScores.get(quizId) || 0;
        if (attempt.percentage > currentBest) {
          quizBestScores.set(quizId, attempt.percentage);
        }
      });
      
      // Calculate average of best scores (one best score per quiz)
      const bestScores = Array.from(quizBestScores.values());
      analytics.learningPattern.averageQuizScore = bestScores.length > 0
        ? bestScores.reduce((sum, s) => sum + s, 0) / bestScores.length
        : 0;
      
      analytics.learningPattern.totalQuizzesTaken = analytics.quizAttempts.length;
      analytics.learningPattern.learningLevel = 
        this.calculateLearningLevel(analytics.learningPattern.averageQuizScore);
      
      // Update last accessed
      analytics.progress.lastAccessedDate = new Date();
      
      await analytics.save();
      
      // Generate recommendations using percentage (not score/totalPoints)
      // Since recommendations work on percentage basis
      const recommendations = this.analyzeQuizPerformance(percentage, 100);
      
      return {
        success: true,
        analytics,
        recommendations
      };
      
    } catch (error) {
      console.error('Error updating analytics:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Gợi ý khóa học dựa trên learning level
  static async recommendCourses(userId, currentCourseId) {
    try {
      const analytics = await LearningAnalytics.findOne({ 
        userId, 
        courseId: currentCourseId 
      });
      
      if (!analytics) {
        return { success: false, message: 'No analytics data found' };
      }
      
      const level = analytics.learningPattern.learningLevel;
      const averageScore = analytics.learningPattern.averageQuizScore; // Now 0-100
      
      // Get current course to find related courses
      const currentCourse = await Course.findById(currentCourseId);
      
      let recommendedCourses = [];
      
      if (level === 'beginner' || averageScore < 50) {
        // Suggest basic courses
        recommendedCourses = await Course.find({
          _id: { $ne: currentCourseId },
          coursePrice: { $lte: currentCourse.coursePrice },
          isPublished: true
        })
        .limit(5)
        .populate('educator', 'name email imageUrl');
        
      } else if (level === 'intermediate') {
        // Suggest intermediate courses
        recommendedCourses = await Course.find({
          _id: { $ne: currentCourseId },
          coursePrice: { 
            $gte: currentCourse.coursePrice * 0.8,
            $lte: currentCourse.coursePrice * 1.5
          },
          isPublished: true
        })
        .limit(5)
        .populate('educator', 'name email imageUrl');
        
      } else {
        // Suggest advanced courses
        recommendedCourses = await Course.find({
          _id: { $ne: currentCourseId },
          coursePrice: { $gte: currentCourse.coursePrice },
          isPublished: true
        })
        .limit(5)
        .populate('educator', 'name email imageUrl');
      }
      
      // Update recommendations in analytics
      analytics.recommendations.suggestedCourses = recommendedCourses.map(c => c._id);
      analytics.recommendations.lastUpdated = new Date();
      await analytics.save();
      
      return {
        success: true,
        level,
        averageScore,
        recommendedCourses
      };
      
    } catch (error) {
      console.error('Error recommending courses:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Kiểm tra xem có được phép học bài tiếp theo không
  static async canAccessNextLesson(userId, courseId, currentLectureId) {
    try {
      const analytics = await LearningAnalytics.findOne({ userId, courseId });
      
      if (!analytics) {
        return { canAccess: true, reason: 'First time learning' };
      }
      
      // Check if there's a recent quiz for current chapter
      const recentQuizzes = analytics.quizAttempts
        .filter(a => {
          const attemptDate = new Date(a.attemptDate);
          const daysSince = (Date.now() - attemptDate) / (1000 * 60 * 60 * 24);
          return daysSince < 7; // Last 7 days
        })
        .sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
      
      if (recentQuizzes.length === 0) {
        return { 
          canAccess: false, 
          reason: 'Bạn cần hoàn thành quiz trước khi tiếp tục',
          requireQuiz: true
        };
      }
      
      const latestQuiz = recentQuizzes[0];
      
      // If score < 50%, need to review
      if (latestQuiz.percentage < 50) {
        return {
          canAccess: false,
          reason: 'Điểm quiz chưa đạt yêu cầu. Vui lòng ôn tập và làm lại quiz',
          currentScore: latestQuiz.percentage,
          requiredScore: 50,
          needReview: true
        };
      }
      
      return {
        canAccess: true,
        reason: 'Good progress!',
        currentScore: latestQuiz.percentage
      };
      
    } catch (error) {
      console.error('Error checking lesson access:', error);
      return { canAccess: true, reason: 'Error checking, allowing access' };
    }
  }
  
  // Lấy dashboard data cá nhân hóa
  static async getPersonalizedDashboard(userId, courseId) {
    try {
      const analytics = await LearningAnalytics.findOne({ userId, courseId })
        .populate('courseId')
        .populate('recommendations.suggestedCourses');
      
      if (!analytics) {
        return {
          success: false,
          message: 'No learning data found'
        };
      }
      
      const course = await Course.findById(courseId);
      
      // Calculate total lectures
      const totalLectures = course.courseContent.reduce(
        (sum, chapter) => sum + chapter.chapterContent.length, 
        0
      );
      
      // Recalculate progress with quiz validation (same logic as updateLectureProgress)
      const Quiz = (await import('../models/Quiz.js')).default;
      const allQuizzes = await Quiz.find({ courseId, isActive: true });
      
      // Build a map: lectureId -> quizId
      const lectureQuizMap = new Map();
      for (const quiz of allQuizzes) {
        const chapter = course.courseContent[quiz.chapterIndex];
        if (chapter && chapter.chapterContent[quiz.lectureIndex]) {
          const lecture = chapter.chapterContent[quiz.lectureIndex];
          lectureQuizMap.set(lecture.lectureId, quiz._id.toString());
        }
      }
      
      // Count truly completed lectures
      let trulyCompletedCount = 0;
      
      for (const lectureId of analytics.progress.completedLectures) {
        const quizId = lectureQuizMap.get(lectureId);
        
        if (quizId) {
          // Lecture has quiz - check if passed
          const quizAttempts = analytics.quizAttempts.filter(
            a => a.quizId.toString() === quizId
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
          }
        } else {
          // No quiz required - just completed is enough
          trulyCompletedCount++;
        }
      }
      
      const completedLectures = trulyCompletedCount;
      const progressPercentage = totalLectures > 0 
        ? Math.round((completedLectures / totalLectures) * 100)
        : 0;
      
      // Get next lesson to study
      let nextLesson = null;
      if (analytics.progress.currentChapterId && analytics.progress.currentLectureId) {
        const chapter = course.courseContent.find(
          ch => ch.chapterId === analytics.progress.currentChapterId
        );
        if (chapter) {
          nextLesson = chapter.chapterContent.find(
            lec => lec.lectureId === analytics.progress.currentLectureId
          );
        }
      }
      
      // Get recent quiz performance
      const recentQuizzes = analytics.quizAttempts
        .slice(-5)
        .reverse();
      
      return {
        success: true,
        dashboard: {
          courseTitle: course.courseTitle,
          courseThumbnail: course.courseThumbnail,
          
          progress: {
            completedLectures,
            totalLectures,
            percentage: progressPercentage
          },
          
          quizPerformance: {
            averageScore: analytics.learningPattern.averageQuizScore.toFixed(1),
            totalQuizzes: analytics.learningPattern.totalQuizzesTaken,
            retakeCount: analytics.learningPattern.quizRetakeCount,
            recentAttempts: recentQuizzes
          },
          
          learningLevel: analytics.learningPattern.learningLevel,
          
          nextLesson: nextLesson ? {
            title: nextLesson.lectureTitle,
            duration: nextLesson.lectureDuration,
            chapterId: analytics.progress.currentChapterId
          } : null,
          
          recommendations: {
            courses: analytics.recommendations.suggestedCourses || [],
            reviewTopics: analytics.recommendations.reviewTopics || []
          },
          
          lastAccessed: analytics.progress.lastAccessedDate
        }
      };
      
    } catch (error) {
      console.error('Error getting personalized dashboard:', error);
      return { success: false, message: error.message };
    }
  }
  
  // Update progress when completing a lecture
  static async updateLectureProgress(userId, courseId, lectureId, chapterId) {
    try {
      console.log('📚 updateLectureProgress called with:', {
        userId,
        courseId,
        lectureId,
        chapterId
      });
      
      // Start transaction for atomic update
      const session = await LearningAnalytics.startSession();
      session.startTransaction();
      
      try {
        let analytics = await LearningAnalytics.findOne({ userId, courseId }).session(session);
        
        console.log('🔍 Found existing analytics:', !!analytics);
        
        if (!analytics) {
          console.log('➕ Creating new analytics document');
          analytics = new LearningAnalytics({
            userId,
            courseId,
            progress: {
              completedLectures: [],
              overallProgress: 0
            }
          });
        }
        
        // Add to completed if not already there
        const alreadyCompleted = analytics.progress.completedLectures.includes(lectureId);
        console.log('📝 Already completed?', alreadyCompleted);
        
        if (!alreadyCompleted) {
          analytics.progress.completedLectures.push(lectureId);
          console.log('✅ Added lecture to completed list. Total:', analytics.progress.completedLectures.length);
        }
        
        // Update current position
        analytics.progress.currentChapterId = chapterId;
        analytics.progress.currentLectureId = lectureId;
        analytics.progress.lastAccessedDate = new Date();
        
        // Calculate overall progress
        const course = await Course.findById(courseId);
        const totalLectures = course.courseContent.reduce(
          (sum, ch) => sum + ch.chapterContent.length, 
          0
        );
        
        console.log('📊 Total lectures in course:', totalLectures);
        console.log('📊 Marked completed lectures:', analytics.progress.completedLectures.length);
        
        // Check which lectures actually count toward progress
        // If a lecture has a quiz, it only counts if the quiz is passed
        const Quiz = (await import('../models/Quiz.js')).default;
        const allQuizzes = await Quiz.find({ courseId, isActive: true });
        
        // Build a map: lectureId -> quizId
        const lectureQuizMap = new Map();
        for (const quiz of allQuizzes) {
          const chapter = course.courseContent[quiz.chapterIndex];
          if (chapter && chapter.chapterContent[quiz.lectureIndex]) {
            const lecture = chapter.chapterContent[quiz.lectureIndex];
            lectureQuizMap.set(lecture.lectureId, quiz._id.toString());
          }
        }
        
        console.log('🎯 Lectures with quizzes:', lectureQuizMap.size);
        
        // Count truly completed lectures
        let trulyCompletedCount = 0;
        
        for (const lectureId of analytics.progress.completedLectures) {
          const quizId = lectureQuizMap.get(lectureId);
          
          if (quizId) {
            // Lecture has quiz - check if passed
            const quizAttempts = analytics.quizAttempts.filter(
              a => a.quizId.toString() === quizId
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
        
        console.log('📊 Truly completed lectures (with quiz check):', trulyCompletedCount);
        
        const progressPercentage = totalLectures > 0
          ? Math.round((trulyCompletedCount / totalLectures) * 100)
          : 0;
        
        analytics.progress.overallProgress = progressPercentage;
        
        console.log('📊 Calculated progress:', progressPercentage + '%');
        
        await analytics.save({ session });
        
        console.log('💾 Saved analytics to DB');
        
        // Also update enrollment completionPercentage to stay in sync
        const Enrollment = (await import('../models/Enrollment.js')).default;
        
        const enrollmentUpdate = await Enrollment.findOneAndUpdate(
          { studentId: userId, courseId },
          {
            $addToSet: { 'progress.lecturesCompleted': lectureId },
            'progress.completionPercentage': progressPercentage,
            'progress.lastAccessedDate': new Date()
          },
          { session, new: true }
        );
        
        console.log('💾 Updated enrollment:', !!enrollmentUpdate);
        
        await session.commitTransaction();
        
        console.log('✅ Transaction committed successfully');
        
        return {
          success: true,
          progress: progressPercentage
        };
        
      } catch (error) {
        await session.abortTransaction();
        console.error('❌ Transaction aborted due to error:', error);
        throw error;
      } finally {
        session.endSession();
      }
      
    } catch (error) {
      console.error('❌ Error updating lecture progress:', error);
      return { success: false, message: error.message };
    }
  }
}

export default PersonalizationService;
