import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Payment from '../models/Payment.js';

// Get comprehensive admin analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Verify admin role (will be checked via Clerk metadata)
    // This is just for extra safety
    
    // === USER STATISTICS ===
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const educators = await User.countDocuments({ role: 'educator' });
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const activeThisMonth = await User.countDocuments({
      updatedAt: { $gte: startOfMonth }
    });
    
    // === COURSE STATISTICS ===
    const allCourses = await Course.find()
      .populate('educator', 'name email')
      .select('courseTitle coursePrice courseRatings enrolledStudents educator createdAt');
    
    const totalCourses = allCourses.length;
    const publishedCourses = allCourses.filter(c => c.isPublished).length;
    
    // Top rated courses
    const coursesWithRatings = allCourses.map(course => {
      const ratings = course.courseRatings || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      
      return {
        _id: course._id,
        title: course.courseTitle,
        educator: course.educator,
        avgRating: avgRating.toFixed(1),
        ratingCount: ratings.length,
        enrollmentCount: course.enrolledStudents?.length || 0
      };
    });
    
    const topRated = coursesWithRatings
      .filter(c => c.ratingCount > 0)
      .sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating))
      .slice(0, 10);
    
    const mostEnrolled = coursesWithRatings
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 10);
    
    // === ENROLLMENT STATISTICS ===
    const totalEnrollments = await Enrollment.countDocuments();
    const enrollmentsThisMonth = await Enrollment.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    const activeEnrollments = await Enrollment.countDocuments({
      status: 'active'
    });
    
    const completedEnrollments = await Enrollment.countDocuments({
      status: 'completed'
    });
    
    // === PAYMENT STATISTICS ===
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({
      status: 'completed'
    });
    
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const revenueThisMonth = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          transactionDate: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // === QUIZ STATISTICS ===
    const totalQuizAttempts = await QuizAttempt.countDocuments();
    const quizAttemptsThisMonth = await QuizAttempt.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    const avgQuizScore = await QuizAttempt.aggregate([
      { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } }
    ]);
    
    // === RATING STATISTICS ===
    const allRatings = allCourses.reduce((acc, course) => {
      return [...acc, ...(course.courseRatings || [])];
    }, []);
    
    const totalRatings = allRatings.length;
    const avgRating = totalRatings > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;
    
    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating]++;
      }
    });
    
    // Recent ratings with user and course info
    const recentRatingsData = [];
    for (const course of allCourses.slice(0, 20)) {
      if (course.courseRatings && course.courseRatings.length > 0) {
        for (const rating of course.courseRatings.slice(-5)) {
          try {
            const user = await User.findById(rating.userId).select('name email imageUrl');
            recentRatingsData.push({
              courseId: course._id,
              courseTitle: course.courseTitle,
              userId: rating.userId,
              userName: user?.name || 'Unknown',
              userEmail: user?.email || '',
              rating: rating.rating,
              review: rating.review || '',
              createdAt: rating.createdAt || course.createdAt
            });
          } catch (err) {
            // Skip if user not found
          }
        }
      }
    }
    
    // Sort by date and take recent 20
    const recentRatings = recentRatingsData
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    
    // === GROWTH STATISTICS (last 6 months) ===
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyEnrollments = await Enrollment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          transactionDate: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          students,
          educators,
          activeThisMonth
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          topRated,
          mostEnrolled
        },
        enrollments: {
          total: totalEnrollments,
          thisMonth: enrollmentsThisMonth,
          active: activeEnrollments,
          completed: completedEnrollments
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          totalRevenue: totalRevenue[0]?.total || 0,
          revenueThisMonth: revenueThisMonth[0]?.total || 0
        },
        quizzes: {
          totalAttempts: totalQuizAttempts,
          attemptsThisMonth: quizAttemptsThisMonth,
          averageScore: avgQuizScore[0]?.avgPercentage?.toFixed(1) || 0
        },
        ratings: {
          total: totalRatings,
          average: avgRating.toFixed(1),
          distribution: ratingDistribution,
          recent: recentRatings
        },
        growth: {
          enrollmentsByMonth: monthlyEnrollments,
          revenueByMonth: monthlyRevenue
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting admin analytics:', error);
    res.json({ success: false, message: error.message });
  }
};
