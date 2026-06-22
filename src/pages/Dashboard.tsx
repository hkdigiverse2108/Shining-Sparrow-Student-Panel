import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMyCourses, useCourses } from '../hooks/useCourses';
import { useMyWorkshops, useWorkshops } from '../hooks/useWorkshops';
import { useBlogs } from '../hooks/useBlogs';
import { CardSkeleton } from '../components/Loader';
import { 
  Video, Award, Clock, ArrowRight, Lock, Flame, ArrowUpRight, Calendar, BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import { 
  handleImageError, FALLBACK_COURSE_IMAGE, FALLBACK_WORKSHOP_IMAGE, getAvatarFallback 
} from '../utils/fallbacks';

interface EnrolledCourse {
  _id: string;
  courseId: {
    _id: string;
    name: string;
    description: string;
    image?: string;
    totalLesson?: number;
    courseLessonIds?: string[];
    duration?: number;
  };
  totalLesson?: number;
  completedLessons?: number;
  lastAccessedLessonId?: string;
  createdAt: string;
  accessStartDate?: string;
  accessExpiryDate?: string | null;
  isAccessExpired?: boolean;
  daysRemaining?: number | null;
}

interface EnrolledWorkshop {
  _id: string;
  workshopId: {
    _id: string;
    title: string;
    description: string;
    image?: string;
    duration?: string;
  };
}

interface CourseItem {
  _id: string;
  name: string;
  description: string;
  image?: string;
  price?: number;
  level?: string;
  enrolledLearners?: number;
  satisfactionRate?: number;
}

interface WorkshopItem {
  _id: string;
  title: string;
  description: string;
  image?: string;
  price?: number;
  duration?: string;
  subTitle?: string;
  about?: string;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const cardContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardItemVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14,
    },
  },
};

export const Dashboard = () => {
  const { student } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'classroom';

  // Sub-filter for classroom view (All, Courses, Workshops)
  const [classroomFilter, setClassroomFilter] = useState<'all' | 'courses' | 'workshops'>('all');

  // 1. Enrolled/Purchased Queries
  const { data: myCoursesRes, isLoading: myCoursesLoading } = useMyCourses({ page: 1, limit: 100 });
  const { data: myWorkshopsRes, isLoading: myWorkshopsLoading } = useMyWorkshops({ page: 1, limit: 100 });

  // 2. Available Programs (Store recommendation list)
  const { data: allCoursesRes, isLoading: allCoursesLoading } = useCourses({ page: 1, limit: 100 });
  const { data: allWorkshopsRes, isLoading: allWorkshopsLoading } = useWorkshops({ page: 1, limit: 100 });

  const enrolledCourses = (myCoursesRes?.data?.purchased_course_data || []) as EnrolledCourse[];
  const enrolledWorkshops = (myWorkshopsRes?.data?.purchased_workshop_data || []) as EnrolledWorkshop[];

  const allCourses = (allCoursesRes?.data?.course_data || []) as CourseItem[];
  const allWorkshops = (allWorkshopsRes?.data?.workshop_data || []) as WorkshopItem[];

  // 3. Blog posts
  const { data: blogsRes, isLoading: blogsLoading } = useBlogs({ page: 1, limit: 100 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blogs = (blogsRes?.data?.blog_data || []) as any[];

  // Statistics & progress calculations
  const totalEnrolled = enrolledCourses.length + enrolledWorkshops.length;
  
  const totalCompletedLessons = enrolledCourses.reduce(
    (acc, curr) => acc + (curr.completedLessons || 0), 
    0
  );
  
  const totalLessonsCount = enrolledCourses.reduce((acc, curr) => {
    const course = curr.courseId;
    const t = curr.totalLesson || (course ? (course.totalLesson || course.courseLessonIds?.length || 10) : 10);
    return acc + t;
  }, 0);

  const completedCoursesCount = enrolledCourses.filter(curr => {
    const course = curr.courseId;
    const t = curr.totalLesson || (course ? (course.totalLesson || course.courseLessonIds?.length || 10) : 10);
    return curr.completedLessons !== undefined && curr.completedLessons >= t && t > 0;
  }).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Filter recommendations: Exclude already purchased programs
  const purchasedCourseIds = new Set(enrolledCourses.map((ec: EnrolledCourse) => ec.courseId?._id));
  const purchasedWorkshopIds = new Set(enrolledWorkshops.map((ew: EnrolledWorkshop) => ew.workshopId?._id));

  const availableCourses = allCourses.filter((course: CourseItem) => !purchasedCourseIds.has(course._id));
  const availableWorkshops = allWorkshops.filter((workshop: WorkshopItem) => !purchasedWorkshopIds.has(workshop._id));

  // Loading skeleton helpers
  const showSkeleton = myCoursesLoading || myWorkshopsLoading || allCoursesLoading || allWorkshopsLoading || (activeTab === 'blogs' && blogsLoading);

  // Render vertical indicator lines for checklists (matches the checklist design in UI)
  const renderVisualChecklist = (completed: number, total: number) => {
    const items = [];
    for (let i = 0; i < total; i++) {
      items.push(
        <span 
          key={i} 
          className={`w-1.5 h-3.5 rounded-sm inline-block mx-0.5 transition-all ${
            i < completed 
              ? 'bg-brand-primary dark:bg-brand-primary shadow-[0_0_6px_rgba(232,100,36,0.5)]' 
              : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />
      );
    }
    return <div className="flex items-center">{items}</div>;
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* 1. Header Area with Sub-Tabs / View Selectors */}
      <motion.div
        variants={pageChildVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100/60 dark:border-slate-800/40 pb-5"
      >
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary dark:text-brand-secondary bg-brand-primary/10 dark:bg-brand-primary/20 px-2.5 py-1 rounded-md">
            Student Space
          </span>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white leading-tight mt-2.5">
            {activeTab === 'classroom' && 'My Active Classroom'}
            {activeTab === 'buy-courses' && 'Direct Course Catalog'}
            {activeTab === 'workshops' && 'Live Interactive Workshops'}
            {activeTab === 'blogs' && 'Announcements & Math Blogs'}
          </h1>
        </div>

        {/* Dynamic header options mirroring the "Columns / List / Calendar" tab layout of reference image */}
        {activeTab === 'classroom' && (
          <div className="flex bg-white dark:bg-page-dark p-1.5 rounded-2xl border border-orange-100/50 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-500 dark:text-slate-400">
            <button 
              onClick={() => setClassroomFilter('all')}
              className={`px-4 py-2 rounded-xl transition-all ${classroomFilter === 'all' ? 'bg-orange-50 dark:bg-orange-950/20 text-brand-primary' : 'hover:text-brand-primary'}`}
            >
              All Programs
            </button>
            <button 
              onClick={() => setClassroomFilter('courses')}
              className={`px-4 py-2 rounded-xl transition-all ${classroomFilter === 'courses' ? 'bg-orange-50 dark:bg-orange-950/20 text-brand-primary' : 'hover:text-brand-primary'}`}
            >
              Courses
            </button>
            <button 
              onClick={() => setClassroomFilter('workshops')}
              className={`px-4 py-2 rounded-xl transition-all ${classroomFilter === 'workshops' ? 'bg-orange-50 dark:bg-orange-950/20 text-brand-primary' : 'hover:text-brand-primary'}`}
            >
              Workshops
            </button>
          </div>
        )}
      </motion.div>

      {/* 2. DYNAMIC CONTENT MAIN DISPLAY */}
      {showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => <CardSkeleton key={n} />)}
        </div>
      ) : (
        <motion.div
          variants={pageChildVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start"
        >
          
          {/* MAIN PANELS COLUMN (2/3 width or full width depending on sidebar visibility) */}
          <div className={`${activeTab === 'classroom' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-10`}>
            
            {/* VIEW A: CLASSROOM TAB */}
            {activeTab === 'classroom' && (
              <div className="space-y-8">
                {enrolledCourses.length === 0 && enrolledWorkshops.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-card-dark border border-dashed rounded-3xl dark:border-slate-800 space-y-4">
                    <span className="text-4xl block">📚</span>
                    <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-200">No active enrollments</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      You haven't unlocked any courses or workshops yet. Head over to the course catalog using the sidebar to get started!
                    </p>
                    <Link
                      to="?tab=buy-courses"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl text-xs shadow-md dark:shadow-none hover:shadow-lg transition-all"
                    >
                      Browse Catalog <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* ENROLLED COURSES COLUMN (matches Kanban layout in reference) */}
                    {(classroomFilter === 'all' || classroomFilter === 'courses') && enrolledCourses.length > 0 && (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                            My Enrolled Courses ({enrolledCourses.length})
                          </h3>
                        </div>

                        <motion.div
                          variants={cardContainerVariants}
                          initial="initial"
                          animate="animate"
                          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        >
                          {enrolledCourses.map((enrollment: EnrolledCourse) => {
                            const course = enrollment.courseId;
                            if (!course) return null;
                            
                            // Get real progress count from backend response
                            const totalLessons = enrollment.totalLesson || course.totalLesson || course.courseLessonIds?.length || 10;
                            const completedCount = enrollment.completedLessons !== undefined ? enrollment.completedLessons : 0;

                            // Access expiry info
                            const isExpired = enrollment.isAccessExpired === true;
                            const daysLeft = enrollment.daysRemaining;
                            const hasExpiry = enrollment.accessExpiryDate !== null && enrollment.accessExpiryDate !== undefined;

                            // Access badge content
                            let accessBadgeText = 'Lifetime Access';
                            let accessBadgeClass = 'bg-emerald-500/80 text-white';
                            if (isExpired) {
                              accessBadgeText = 'Access Expired';
                              accessBadgeClass = 'bg-red-500/90 text-white';
                            } else if (hasExpiry && daysLeft !== null && daysLeft !== undefined) {
                              accessBadgeText = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
                              accessBadgeClass = daysLeft <= 7
                                ? 'bg-red-500/80 text-white animate-pulse'
                                : daysLeft <= 14
                                  ? 'bg-amber-500/80 text-white'
                                  : 'bg-emerald-500/80 text-white';
                            }

                            return (
                              <motion.div
                                key={enrollment._id}
                                variants={cardItemVariants}
                                className={`ui-card ui-card-hover flex flex-col justify-between space-y-4 relative overflow-hidden group ${isExpired ? 'opacity-70' : ''}`}
                              >
                                {/* Glowing accent bubble */}
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors duration-300" />
                                
                                <div className="space-y-4 relative z-10">
                                  {/* Top banner image */}
                                  <div className="h-36 bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden relative">
                                    <img
                                      src={course.image || FALLBACK_COURSE_IMAGE}
                                      alt={course.name}
                                      className={`w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ${isExpired ? 'grayscale' : ''}`}
                                      onError={(e) => handleImageError(e, FALLBACK_COURSE_IMAGE)}
                                    />
                                    {/* Progress badge */}
                                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-brand-primary text-white rounded-full text-[9px] font-black shadow-md">
                                      {totalLessons > 0 ? Math.round((completedCount/totalLessons)*100) : 0}% Complete
                                    </div>
                                    {/* Access status badge */}
                                    <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 backdrop-blur-md rounded-md text-[9px] font-black uppercase tracking-wider ${accessBadgeClass}`}>
                                      {accessBadgeText}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-display font-black text-sm text-slate-800 dark:text-white line-clamp-1 leading-snug tracking-tight group-hover:text-brand-primary transition-colors">
                                      {course.name}
                                    </h4>

                                    {/* Progress Checklists Layout */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 px-3.5 py-2.5 rounded-2xl border border-orange-100/20 dark:border-slate-800/30">
                                      <span className="font-semibold flex items-center gap-1">
                                        <Clock size={12} className="text-slate-400" /> Duration
                                      </span>
                                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                                        {course.duration ? `${course.duration} Hours` : 'Flexible study'}
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                                        <span>Course Progress</span>
                                        <span className="text-brand-primary">{completedCount}/{totalLessons} Done</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {renderVisualChecklist(completedCount, totalLessons)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-orange-100/30 dark:border-slate-800/40 flex justify-between items-center gap-3 relative z-10">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                                    <Video size={14} className="text-brand-primary" />
                                    <span>Video Lectures</span>
                                  </div>
                                  {isExpired ? (
                                    <button
                                      className="px-4.5 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                                      onClick={() => window.location.href = `/courses/${course._id}`}
                                    >
                                      Renew Access
                                    </button>
                                  ) : (
                                    <Link
                                      to={`/courses/${course._id}?from=classroom`}
                                      className="ui-button-primary px-4.5 py-2"
                                    >
                                      Enter Classroom
                                    </Link>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </div>
                    )}

                    {/* ENROLLED WORKSHOPS COLUMN (matches Kanban layout in reference) */}
                    {(classroomFilter === 'all' || classroomFilter === 'workshops') && enrolledWorkshops.length > 0 && (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-secondary"></span>
                            My Enrolled Workshops ({enrolledWorkshops.length})
                          </h3>
                        </div>

                        <motion.div
                          variants={cardContainerVariants}
                          initial="initial"
                          animate="animate"
                          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        >
                          {enrolledWorkshops.map((enrollment: EnrolledWorkshop) => {
                            const workshop = enrollment.workshopId;
                            if (!workshop) return null;

                            return (
                              <motion.div
                                key={enrollment._id}
                                variants={cardItemVariants}
                                className="ui-card ui-card-hover flex flex-col justify-between space-y-4 relative overflow-hidden group"
                              >
                                {/* Glowing accent bubble */}
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl group-hover:bg-brand-secondary/10 transition-colors duration-300" />

                                <div className="space-y-4 relative z-10">
                                  {/* Top banner image */}
                                  <div className="h-36 bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden relative">
                                    <img
                                      src={workshop.image || FALLBACK_WORKSHOP_IMAGE}
                                      alt={workshop.title}
                                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                      onError={(e) => handleImageError(e, FALLBACK_WORKSHOP_IMAGE)}
                                    />
                                    {/* Status tag absolute on top right */}
                                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-brand-secondary text-white rounded-full text-[9px] font-black shadow-md">
                                      Classroom Live
                                    </div>
                                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white rounded-md text-[9px] font-black uppercase tracking-wider">
                                      Live Stream
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h4 className="font-display font-black text-sm text-slate-800 dark:text-white line-clamp-1 leading-snug tracking-tight group-hover:text-brand-secondary transition-colors">
                                      {workshop.title}
                                    </h4>

                                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40 px-3.5 py-2.5 rounded-2xl border border-orange-100/20 dark:border-slate-800/30">
                                      <span className="font-semibold flex items-center gap-1">
                                        <Clock size={12} className="text-slate-400" /> Duration
                                      </span>
                                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                                        {workshop.duration || 'Full Session Access'}
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                                        <span>Workshop Progress</span>
                                        <span className="text-brand-secondary">Class 1/4</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {renderVisualChecklist(1, 4)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-orange-100/30 dark:border-slate-800/40 flex justify-between items-center gap-3 relative z-10">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                                    <Video size={14} className="text-brand-secondary" />
                                    <span>Live Video Access</span>
                                  </div>
                                  <Link
                                    to={`/courses/${workshop._id}?type=workshop&from=classroom`}
                                    className="ui-button-secondary px-4.5 py-2"
                                  >
                                    Enter Stream
                                  </Link>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: DIRECT COURSE RECOMMENDATIONS CATALOG */}
            {activeTab === 'buy-courses' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    Courses Available for Instant Purchase
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Unlock structural abacus and finger math courses with Secure Razorpay Checkout.
                  </p>
                </div>

                {availableCourses.length > 0 ? (
                  <motion.div
                    variants={cardContainerVariants}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    {availableCourses.map((course: CourseItem) => (
                      <motion.div
                        key={course._id}
                        variants={cardItemVariants}
                        className="ui-card ui-card-hover flex flex-col justify-between space-y-4 relative group"
                      >
                        <div className="space-y-4">
                          <div className="h-36 bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden relative">
                            <img
                              src={course.image || FALLBACK_COURSE_IMAGE}
                              alt={course.name}
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                              onError={(e) => handleImageError(e, FALLBACK_COURSE_IMAGE)}
                            />
                            <div className="absolute top-2.5 right-2.5 px-3 py-1 bg-brand-primary text-white rounded-full text-xs font-black shadow-md">
                              ₹{course.price}
                            </div>
                            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white rounded-md text-[9px] font-black uppercase tracking-wider">
                              {course.level || 'All Levels'}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-display font-black text-sm text-slate-800 dark:text-white line-clamp-1 leading-snug group-hover:text-brand-primary transition-colors">
                              {course.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1">👥 {course.enrolledLearners || 250}+ Learners</span>
                              <span>•</span>
                              <span className="text-emerald-500">🌟 {course.satisfactionRate || 98}% Rate</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {stripHtml(course.description || '')}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-orange-100/30 dark:border-slate-800/40">
                          <Link
                            to={`/courses/${course._id}`}
                            className="ui-button-outline w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                          >
                            <Lock size={12} className="shrink-0" /> Unlock Curriculum
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-card-dark border border-dashed rounded-3xl dark:border-slate-800 text-slate-400 text-xs">
                    🎉 You have unlocked all our structural abacus math courses!
                  </div>
                )}
              </div>
            )}

            {/* VIEW C: WORKSHOPS CATALOG */}
            {activeTab === 'workshops' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    Direct Workshops Catalog
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Live interactive streams and classroom workshops to level up finger calculation.
                  </p>
                </div>

                {availableWorkshops.length > 0 ? (
                  <motion.div
                    variants={cardContainerVariants}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    {availableWorkshops.map((workshop: WorkshopItem) => (
                      <motion.div
                        key={workshop._id}
                        variants={cardItemVariants}
                        className="ui-card ui-card-hover flex flex-col justify-between space-y-4 relative group"
                      >
                        <div className="space-y-4">
                          <div className="h-36 bg-slate-50 dark:bg-slate-900/60 rounded-2xl overflow-hidden relative">
                            <img
                              src={workshop.image || FALLBACK_WORKSHOP_IMAGE}
                              alt={workshop.title}
                              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                              onError={(e) => handleImageError(e, FALLBACK_WORKSHOP_IMAGE)}
                            />
                            <div className="absolute top-2.5 right-2.5 px-3 py-1 bg-brand-primary text-white rounded-full text-xs font-black shadow-md">
                              ₹{workshop.price}
                            </div>
                            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white rounded-md text-[9px] font-black uppercase tracking-wider">
                              Live Class
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-display font-black text-sm text-slate-800 dark:text-white line-clamp-1 leading-snug group-hover:text-brand-secondary transition-colors">
                              {workshop.title}
                            </h4>
                            <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-wider">
                              {workshop.subTitle || 'Interactive Lecture Stream'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {stripHtml(workshop.about || '')}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3.5 border-t border-orange-100/30 dark:border-slate-800/40">
                          <Link
                            to={`/courses/${workshop._id}?type=workshop`}
                            className="ui-button-outline w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
                          >
                            <Lock size={12} className="shrink-0" /> Unlock Session
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-card-dark border border-dashed rounded-3xl dark:border-slate-800 text-slate-400 text-xs">
                    🎉 You have enrolled in all live abacus math workshops!
                  </div>
                )}
              </div>
            )}

            {/* VIEW D: BLOGS & UPDATES */}
            {activeTab === 'blogs' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    Math Tips & Student Bulletins
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    Stay updated with abacus guidelines, mental math secrets, and community announcements.
                  </p>
                </div>

                {blogs.length > 0 ? (
                  <motion.div
                    variants={cardContainerVariants}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {blogs.map((blog) => {
                      const blogImage = blog.coverImage || blog.mainImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600';
                      const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      const mockReads = Math.abs(blog.title.length * 17) % 800 + 150;
                      const previewText = blog.subTitle || (blog.content ? stripHtml(blog.content).substring(0, 120) + '...' : '');

                      return (
                        <motion.div
                          key={blog._id}
                          variants={cardItemVariants}
                          className="ui-card ui-card-hover flex flex-col justify-between h-full group"
                        >
                          <div className="space-y-4 flex-1 flex flex-col">
                            {/* Card Image */}
                            <div className="h-44 rounded-2xl bg-orange-50 dark:bg-slate-900/60 overflow-hidden shrink-0 relative border border-slate-100 dark:border-slate-800">
                              <img
                                src={blogImage}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => handleImageError(e, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600')}
                              />
                              {/* Floating Category Badge */}
                              {blog.category && (
                                <div className="absolute top-3 left-3 px-2.5 py-1 bg-brand-primary text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md z-10">
                                  {blog.category}
                                </div>
                              )}
                            </div>
                            
                            {/* Card Body */}
                            <div className="flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-2.5">
                                {/* Metadata */}
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} className="text-brand-primary" />
                                    {formattedDate}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen size={12} className="text-brand-primary" />
                                    {mockReads} reads
                                  </span>
                                </div>
                                
                                <h4 className="font-display font-black text-base text-slate-850 dark:text-white leading-snug group-hover:text-brand-primary transition-colors duration-300 line-clamp-2 min-h-11">
                                  {blog.title}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                  {previewText}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Footer */}
                          <div className="pt-4 mt-4 border-t border-orange-50/30 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <img 
                                src={getAvatarFallback(blog.author || 'Shining-Sparrow Team')} 
                                alt={blog.author || 'Author'} 
                                className="w-6 h-6 rounded-full border dark:border-slate-700" 
                              />
                              <span className="text-[10px] text-slate-450 font-bold max-w-28 truncate">
                                {blog.author || 'Shining-Sparrow Team'}
                              </span>
                            </div>
                            
                            <Link 
                              to={`/blogs/${blog._id}`}
                              className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline shrink-0"
                            >
                              Read Article <ArrowUpRight size={14} />
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <div className="ui-card border border-dashed text-slate-400 text-center py-12 text-xs">
                    📰 No announcements or math blogs published yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR WIDGET COLUMN (1/3 width) - only shown on classroom tab */}
          {activeTab === 'classroom' && (
            <div className="lg:col-span-1 space-y-8 w-full">
              
              {/* 1. SPARKY THE MASCOT WELCOME CARD */}
              <motion.div
                initial={{ rotate: -2, y: 5 }}
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="bg-linear-to-br from-orange-500 to-brand-primary text-white rounded-3xl p-6 shadow-[0_15px_30px_rgba(232,100,36,0.3)] dark:shadow-[0_0_30px_rgba(232,100,36,0.35)] rotate-[-2.5deg] border border-orange-400/20 space-y-4 hover:rotate-0 transition-transform duration-300 flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Background bubbles */}
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-white/5 rounded-full blur-xl" />

                <div className="flex items-center justify-between w-full relative z-10">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md">
                    Mascot Companion
                  </span>
                  <Flame size={18} className="text-amber-300 fill-current animate-pulse" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md scale-110 animate-pulse" />
                    <img 
                      src="/mascot.png" 
                      alt="Sparky the Sparrow" 
                      className="w-18 h-18 object-contain relative z-10 drop-shadow-md"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="font-display font-black text-lg leading-tight">
                      {getGreeting()}, {student?.fullName ? student.fullName.split(' ')[0] : 'Hero'}! 🌟
                    </h4>
                    <p className="text-xs text-orange-50/90 leading-relaxed font-medium">
                      I'm Sparky! Ready to practice some mental math and level up your skills today? Let's soar together!
                    </p>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="w-full text-center py-2.5 bg-white text-brand-primary font-black rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-md flex items-center justify-center gap-1.5 relative z-10 animate-pulse"
                >
                  View My Hero Sheet
                </Link>
              </motion.div>

              {/* 2. REAL PROGRESS STATISTICS CARD */}
              <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Award size={18} className="text-orange-500" />
                  My Learning Stats
                </h3>
                
                <div className="space-y-4 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between items-center py-2 border-b border-orange-50/50 dark:border-slate-800/50">
                    <span className="text-slate-400">Secret Access Key</span>
                    <span className="font-mono text-[11px] bg-orange-50 dark:bg-orange-950/20 text-brand-primary dark:text-brand-secondary px-2 py-0.5 rounded font-black tracking-wider">
                      {student?.otr || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-orange-50/50 dark:border-slate-800/50">
                    <span className="text-slate-400">Active Programs</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">{totalEnrolled} Enrolled</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-orange-50/50 dark:border-slate-800/50">
                    <span className="text-slate-400">Lessons Finished</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                      {totalCompletedLessons} / {totalLessonsCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Completed Courses</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                      {completedCoursesCount} Course{completedCoursesCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. STATIC GUIDELINES FAQ */}
              <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  💡 Useful Guidelines
                </h3>
                
                <div className="space-y-3.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      How do I unlock intermediate abacus levels?
                    </p>
                    <p className="text-slate-550 dark:text-slate-400">
                      Finish all current course lessons and score above 80% on the final timed assessments.
                    </p>
                  </div>
                  <div className="space-y-1 pt-1.5 border-t border-orange-50/30 dark:border-slate-800/20">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      Where is my Razorpay receipt?
                    </p>
                    <p className="text-slate-550 dark:text-slate-400">
                      Sent to your registered email address automatically post-checkout.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </motion.div>
      )}

    </div>
  );
};
