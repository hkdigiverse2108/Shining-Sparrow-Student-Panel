import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCourse, usePurchaseCourse, useMyCourses } from '../hooks/useCourses';
import { useWorkshop, usePurchaseWorkshop, useMyWorkshops } from '../hooks/useWorkshops';
import { useSettings, useFAQs, useSubmitTestimonial } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Loader } from '../components/Loader';
import { loadRazorpayScript } from '../utils/razorpay';
import { 
  handleImageError, FALLBACK_COURSE_IMAGE, FALLBACK_WORKSHOP_IMAGE 
} from '../utils/fallbacks';
import { ArrowRight, ShieldCheck, CheckCircle2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

interface Lesson {
  _id: string;
  title: string;
  subtitle?: string;
  isUnlocked: boolean;
  duration?: string;
}

interface SubCourse {
  _id: string;
  title: string;
  courseLessonsAssigned?: Lesson[];
}

interface WorkshopCurriculum {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  duration?: string;
}

interface EnrolledCourse {
  _id: string;
  courseId: {
    _id: string;
  } | null;
}

interface EnrolledWorkshop {
  _id: string;
  workshopId: {
    _id: string;
  } | null;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export const CourseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isWorkshop = searchParams.get('type') === 'workshop';
  const navigate = useNavigate();
  
  const { isAuthenticated, student } = useAuth();
  const { showToast } = useToast();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'faqs'>('overview');
  const [faqLanguage, setFaqLanguage] = useState<'en' | 'hi' | 'gu'>('en');

  // Queries
  const { data: settingsData } = useSettings();
  const { data: courseData, isLoading: courseLoading } = useCourse(id || '');
  const { data: workshopData, isLoading: workshopLoading } = useWorkshop(id || '');
  const { data: faqsRes } = useFAQs({
    learningCatalogFilter: id || '',
    type: isWorkshop ? 'workshop' : 'course',
    limit: 50,
  });
  const dbFAQs = faqsRes?.data?.faq_data || [];

  // Enrolled checks
  const { data: myCoursesRes } = useMyCourses({ page: 1, limit: 100 });
  const { data: myWorkshopsRes } = useMyWorkshops({ page: 1, limit: 100 });

  const enrolledCourses = (myCoursesRes?.data?.purchased_course_data || []) as EnrolledCourse[];
  const enrolledWorkshops = (myWorkshopsRes?.data?.purchased_workshop_data || []) as EnrolledWorkshop[];

  const isPurchased = isWorkshop 
    ? enrolledWorkshops.some((ew: EnrolledWorkshop) => ew.workshopId?._id === id)
    : enrolledCourses.some((ec: EnrolledCourse) => ec.courseId?._id === id);


  // Mutations
  const purchaseCourseMutation = usePurchaseCourse();
  const purchaseWorkshopMutation = usePurchaseWorkshop();

  // Local state
  const [purchasing, setPurchasing] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Review form states
  const [reviewName, setReviewName] = useState(student?.fullName || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const submitTestimonialMutation = useSubmitTestimonial();

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewText) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    submitTestimonialMutation.mutate(
      {
        name: reviewName,
        description: reviewText,
        rate: reviewRating,
        type: 'workshop',
        learningCatalogId: id || '',
      },
      {
        onSuccess: () => {
          showToast('Thank you for your feedback! 🌟', 'success');
          setReviewText('');
          setSubmitSuccess(true);
        },
        onError: () => {
          showToast('Failed to submit review. Please try again.', 'error');
        }
      }
    );
  };

  const isLoading = isWorkshop ? workshopLoading : courseLoading;
  const item = isWorkshop ? workshopData?.data : courseData?.data;

  if (isLoading) {
    return <Loader />;
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Item not found</h2>
        <p className="text-slate-500 mt-2">The course or workshop details could not be found.</p>
      </div>
    );
  }

  // Access expiry info from the course detail API (available after item is loaded)
  const isAccessExpired = !isWorkshop && item ? item.isAccessExpired === true : false;
  const daysRemaining = !isWorkshop && item ? item.daysRemaining : null;
  const accessExpiryDate = !isWorkshop && item ? item.accessExpiryDate : null;
  const hasAccessExpiry = accessExpiryDate !== null && accessExpiryDate !== undefined;


  const price = item.price;
  const name = isWorkshop ? item.title : item.name;
  const description = isWorkshop ? item.about : item.description;
  const pdfUrl = isWorkshop ? item.pdfAttach : item.pdf;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      showToast('Please login to purchase this program.', 'warning');
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      const razorpayKey = settingsData?.data?.razorpayKey;
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !razorpayKey) {
        showToast('Payment gateway offline. Opening payment simulator...', 'info');
        setShowSimulateModal(true);
        setPurchasing(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: price * 100,
        currency: 'INR',
        name: 'Shining-Sparrow',
        description: `Enroll in ${name}`,
        handler: async (response: RazorpayResponse) => {
          try {
            if (isWorkshop) {
              await purchaseWorkshopMutation.mutateAsync({
                workshop_id: item._id,
                amount: price,
                payment_id: response.razorpay_payment_id,
                final_amount: price,
              });
            } else {
              await purchaseCourseMutation.mutateAsync({
                courseId: item._id,
                razorpayOrderId: response.razorpay_order_id || 'ORDER_' + Math.random().toString(36).substring(2, 9),
                razorpayPaymentId: response.razorpay_payment_id,
              });
            }
            showToast('Enrollment successful!', 'success');
            navigate('/dashboard');
          } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            showToast(error.response?.data?.message || 'Verification failed. Contact support.', 'error');
          }
        },
        prefill: {
          name: student?.fullName || '',
          email: student?.email || '',
          contact: student?.phoneNumber || '',
        },
        theme: {
          color: '#e86424',
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay Init Error', err);
      showToast('Checkout failed. Opening payment simulator...', 'info');
      setShowSimulateModal(true);
    } finally {
      setPurchasing(false);
    }
  };

  const handleSimulatePayment = async () => {
    setPurchasing(true);
    setShowSimulateModal(false);
    try {
      const mockPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 12);
      
      if (isWorkshop) {
        await purchaseWorkshopMutation.mutateAsync({
          workshop_id: item._id,
          amount: price,
          payment_id: mockPaymentId,
          final_amount: price,
        });
      } else {
        await purchaseCourseMutation.mutateAsync({
          courseId: item._id,
          razorpayOrderId: 'order_sim_' + Math.random().toString(36).substring(2, 10),
          razorpayPaymentId: mockPaymentId,
        });
      }
      
      showToast('Simulation Enrollment successful!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Simulation enrollment failed.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-50 dark:bg-page-dark transition-colors duration-200">
      
      {/* 1. Immersive Hero Banner (Full width) */}
      <div className="w-full bg-linear-to-br from-slate-900 via-[#1f130d] to-slate-950 text-white border-b border-orange-500/10 relative overflow-hidden py-12 lg:py-16">
        {/* Abstract glowing ambient accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <motion.div variants={pageChildVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-brand-secondary flex items-center gap-1.5 border border-white/5">
              {isWorkshop ? '🎥 Interactive Live Stream' : '📚 Structured Curriculum'}
            </span>
            {item.language && (
              <span className="px-3 py-1.5 bg-white/5 rounded-full text-slate-300">
                🌐 {item.language}
              </span>
            )}
            <span className="px-3 py-1.5 bg-white/5 rounded-full text-slate-350 flex items-center gap-1">
              ⭐ 4.9 (120+ ratings)
            </span>
          </div>

          <div className="space-y-4 max-w-3xl">
            <h1 className="font-display font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-linear-to-r from-white via-orange-100 to-brand-secondary leading-tight tracking-tight">
              {name}
            </h1>
            {item.subTitle && (
              <p className="text-brand-secondary font-bold text-sm sm:text-base tracking-wide leading-relaxed">
                {item.subTitle}
              </p>
            )}
            <div 
              className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: description || '' }}
            />
          </div>

          {/* Banner Quick Stats */}
          <div className="flex flex-wrap gap-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <div>
                <span className="block text-sm font-bold text-slate-100">
                  {item.enrolledLearners || 1240}+
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Learners Enrolled</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <div>
                <span className="block text-sm font-bold text-slate-100">
                  {item.duration || 'Flexible'}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Duration</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div>
                <span className="block text-sm font-bold text-slate-100">
                  Certification
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Course Awarded</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Main split page content */}
      <motion.div variants={pageChildVariants} className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Main Details Panel (Left 2/3 Column) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tab selectors */}
            <div className="flex border-b border-orange-100/50 dark:border-slate-800/60 pb-px">
              {[
                { id: 'overview', label: 'Program Overview' },
                ...(!isWorkshop ? [{ id: 'syllabus', label: 'Curriculum Syllabus' }] : []),
                { id: 'faqs', label: isWorkshop ? 'Reviews & FAQs' : 'FAQs' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'syllabus' | 'faqs')}
                    className={`relative py-3.5 px-6 text-sm font-extrabold transition-all border-b-2 -mb-px outline-none cursor-pointer ${
                      isActive 
                        ? 'border-brand-primary text-brand-primary' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB PANELS */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* About Description */}
                    <div className="ui-card space-y-4">
                      <h3 className="font-display font-extrabold text-lg text-slate-850 dark:text-white">
                        About this {isWorkshop ? 'Workshop' : 'Course'}
                      </h3>
                      <div 
                        className="rich-text-content text-xs text-slate-655 dark:text-slate-350 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description || 'No description available.' }}
                      />
                      
                      {pdfUrl && (
                        <div className="pt-4 border-t border-orange-100/10 dark:border-slate-800/40">
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ui-button-outline px-5 py-2.5 text-xs flex items-center gap-2"
                          >
                            📥 Download Syllabus PDF
                          </a>
                        </div>
                      )}
                    </div>

                    {/* General course cards (only shown for courses) */}
                    {!isWorkshop && (
                      <>
                        {/* What you will gain */}
                        <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-855/60 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="font-display font-extrabold text-lg text-slate-850 dark:text-white flex items-center gap-2">
                            <span className="text-xl">💡</span> What you will gain from this program
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              { title: 'Master Mental Speed Calculations', desc: 'Perform double-digit arithmetic calculations without paper or calculators.' },
                              { title: 'Boost Cognitive Memory Span', desc: 'Improve auditory concentration limits and 3D visualization capabilities.' },
                              { title: 'Hands-on Interactive Worksheets', desc: 'Access downloadable abacus drills and practice sheets at every level.' },
                              { title: 'Level Assessment Certificates', desc: 'Verify your calculations competence with automated passing badges.' }
                            ].map((takeaway, index) => (
                              <div 
                                key={index}
                                className="p-4 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/30 dark:border-slate-800/40 rounded-2xl flex items-start gap-3 hover:shadow-[0_4px_20px_rgba(232,100,36,0.02)] transition-shadow"
                              >
                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <h4 className="font-bold text-xs text-slate-855 dark:text-slate-200">{takeaway.title}</h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{takeaway.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Prerequisites */}
                        <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-855/60 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="font-display font-extrabold text-base text-slate-855 dark:text-white flex items-center gap-2">
                            <span className="text-lg">⚙️</span> Program Prerequisites
                          </h3>
                          <ul className="text-xs text-slate-655 dark:text-slate-350 space-y-2.5 pl-1.5">
                            <li className="flex items-center gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                              Recommended for children aged 5-15 years (or anyone interested in speed arithmetic).
                            </li>
                            <li className="flex items-center gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                              No prior abacus or finger math training required — we start from absolute basics.
                            </li>
                            <li className="flex items-center gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                              A physical 17-rod Soroban abacus is recommended (optional, since a digital simulator is included).
                            </li>
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Workshop details card (only shown for workshops) */}
                    {isWorkshop && (
                      <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-855/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="font-display font-extrabold text-base text-slate-855 dark:text-white flex items-center gap-2">
                          <span className="text-lg">📋</span> Workshop Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
                          {item.duration && (
                            <div className="p-3.5 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/20 dark:border-slate-800/40 rounded-2xl space-y-1">
                              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Duration</span>
                              <span className="text-slate-800 dark:text-slate-205 font-black text-sm">{item.duration}</span>
                            </div>
                          )}
                          {item.language && (
                            <div className="p-3.5 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/20 dark:border-slate-800/40 rounded-2xl space-y-1">
                              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Language</span>
                              <span className="text-slate-800 dark:text-slate-205 font-black text-sm">{item.language}</span>
                            </div>
                          )}
                          {item.validFor && (
                            <div className="p-3.5 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/20 dark:border-slate-800/40 rounded-2xl space-y-1">
                              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Validity</span>
                              <span className="text-slate-800 dark:text-slate-205 font-black text-sm">{item.validFor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SYLLABUS */}
                {activeTab === 'syllabus' && (
                  <div className="space-y-6">
                    <div className="space-y-1 pb-2">
                      <h3 className="font-display font-extrabold text-lg text-slate-850 dark:text-white">
                        Curriculum Syllabus Roadmap
                      </h3>
                      <p className="text-xs text-slate-450 dark:text-slate-400">
                        {isWorkshop ? 'Step-by-step live interactive lecture curriculum.' : 'Self-paced level-wise learning modules. Pass exams to unlock levels.'}
                      </p>
                    </div>

                    {/* SYLLABUS LIST */}
                    {isWorkshop ? (
                      item.workshopCurriculum && item.workshopCurriculum.length > 0 ? (
                        <div className="bg-white border border-orange-100 dark:bg-card-dark dark:border-slate-855/60 rounded-3xl p-6 shadow-sm space-y-4">
                          {item.workshopCurriculum.map((curr: WorkshopCurriculum, idx: number) => (
                            <div 
                              key={curr._id} 
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/40 pb-4 last:border-0 last:pb-0"
                            >
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="space-y-1">
                                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                                    {curr.title}
                                  </h4>
                                  {curr.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                      {curr.description}
                                    </p>
                                  )}
                                  {curr.date && (
                                    <span className="inline-block text-[10px] text-brand-primary font-bold bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-md mt-1">
                                      📅 Session: {new Date(curr.date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                {curr.duration || 'Session Access'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-white border dark:bg-card-dark dark:border-slate-800/40 rounded-3xl text-slate-400 text-xs">
                          Live streaming syllabus details will be updated soon.
                        </div>
                      )
                    ) : (
                      item.courseCurriculumIds && item.courseCurriculumIds.length > 0 ? (
                        <div className="space-y-4">
                          {item.courseCurriculumIds.map((subCourse: SubCourse) => (
                            <div 
                              key={subCourse._id} 
                              className="ui-card space-y-3.5"
                            >
                              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                                <h4 className="font-extrabold text-sm text-brand-primary dark:text-brand-secondary">
                                  {subCourse.title}
                                </h4>
                                <span className="text-[10px] bg-orange-50 dark:bg-orange-950/20 text-brand-primary font-black px-2 py-0.5 rounded-md">
                                  {subCourse.courseLessonsAssigned?.length || 0} Lessons
                                </span>
                              </div>
                              <div className="space-y-2.5">
                                {subCourse.courseLessonsAssigned && subCourse.courseLessonsAssigned.length > 0 ? (
                                  subCourse.courseLessonsAssigned.map((lesson: Lesson, idx: number) => (
                                    <div 
                                      key={lesson._id} 
                                      className="flex items-center justify-between text-xs text-slate-655 dark:text-slate-350 px-1 py-1 hover:bg-orange-50/20 dark:hover:bg-slate-800/30 rounded-lg transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span className="w-5 h-5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                          {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="font-semibold truncate">{lesson.title}</p>
                                          {lesson.subtitle && (
                                            <p className="text-[10px] text-slate-400 truncate">{lesson.subtitle}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        {lesson.isUnlocked ? (
                                          <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-1 rounded-full text-[10px]" title="Unlocked">
                                            🔓
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-[10px]" title="Locked">
                                            🔒
                                          </span>
                                        )}
                                        {lesson.duration && (
                                          <span className="text-[10px] text-slate-400 font-medium">{lesson.duration}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-400">No lessons assigned to this level yet.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : item.courseLessonIds && item.courseLessonIds.length > 0 ? (
                        <div className="bg-white border border-orange-100 dark:bg-card-dark dark:border-slate-855/60 rounded-3xl p-5 shadow-sm space-y-3.5">
                          {item.courseLessonIds.map((lesson: Lesson, idx: number) => (
                            <div 
                              key={lesson._id} 
                              className="flex items-center justify-between text-xs text-slate-655 dark:text-slate-350 border-b border-slate-50 dark:border-slate-800/40 pb-2.5 last:border-0 last:pb-0"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-semibold">{lesson.title}</p>
                                  {lesson.subtitle && (
                                    <p className="text-[10px] text-slate-400">{lesson.subtitle}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {lesson.isUnlocked ? (
                                  <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-1 rounded-full text-[10px]">
                                    🔓 Unlocked
                                  </span>
                                ) : (
                                  <span className="text-slate-400 bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-[10px]">
                                    🔒 Locked
                                  </span>
                                )}
                                {lesson.duration && (
                                  <span className="text-[10px] text-slate-400 font-medium">{lesson.duration}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white border border-orange-100 dark:bg-card-dark dark:border-slate-800/40 rounded-3xl p-5 shadow-sm text-center text-slate-400 text-xs">
                          Syllabus details will be updated soon.
                        </div>
                      )
                    )}
                  </div>
                )}
                {/* TAB 3: FAQS & REVIEWS */}
                {activeTab === 'faqs' && (
                  <div className="space-y-8">
                    {/* Database-backed Testimonials / Reviews (only shown for workshops) */}
                    {isWorkshop && item.workshopTestimonials && item.workshopTestimonials.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-display font-extrabold text-base text-slate-855 dark:text-white">
                          What Students Say
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.workshopTestimonials.map((t: any) => (
                            <div 
                              key={t._id} 
                              className="bg-white dark:bg-card-dark border border-orange-100/30 dark:border-slate-855/50 rounded-2xl p-4.5 space-y-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                {t.image ? (
                                  <img 
                                    src={t.image} 
                                    alt={t.name} 
                                    className="w-10 h-10 rounded-full object-cover border dark:border-slate-800" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/20 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0">
                                    {t.name ? t.name[0].toUpperCase() : 'S'}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-bold text-xs text-slate-805 dark:text-slate-200">{t.name}</h4>
                                  <p className="text-[10px] text-slate-400">{t.designation || 'Student'}</p>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                "{t.description}"
                              </p>
                              {t.rate && (
                                <div className="text-[10px] text-amber-500">
                                  {'★'.repeat(t.rate)}{'☆'.repeat(5 - t.rate)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Review submission form */}
                    {isWorkshop && isAuthenticated && isPurchased && (
                      <div className="ui-card space-y-5">
                        <div className="border-b dark:border-slate-800 pb-3">
                          <h3 className="font-display font-extrabold text-base text-slate-855 dark:text-white">
                            Share Your Experience
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Since you've enrolled in this workshop, we would love to hear your feedback!
                          </p>
                        </div>

                        {submitSuccess ? (
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/40 rounded-2xl text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            🎉 Your review has been submitted successfully. Thank you!
                          </div>
                        ) : (
                          <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                                  Your Name
                                </label>
                                <input
                                  type="text"
                                  value={reviewName}
                                  onChange={(e) => setReviewName(e.target.value)}
                                  className="ui-input font-semibold pl-4!"
                                  placeholder="Enter your name"
                                  required
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                                  Rating
                                </label>
                                <div className="flex items-center gap-1.5 h-11">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setReviewRating(star)}
                                      className="text-xl transition-all hover:scale-120 cursor-pointer"
                                    >
                                      {star <= reviewRating ? (
                                        <span className="text-amber-500">★</span>
                                      ) : (
                                        <span className="text-slate-300 dark:text-slate-700">☆</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                                Review Message
                              </label>
                              <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                className="w-full p-3.5 text-sm bg-white dark:bg-slate-900 border border-brand-primary/15 dark:border-slate-800 rounded-2xl outline-none focus:border-brand-primary dark:focus:border-brand-secondary transition-colors text-slate-800 dark:text-slate-200 font-medium leading-relaxed resize-none"
                                rows={3}
                                placeholder="What did you think of the sessions? Share your abacus and calculation journey with us!"
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={submitTestimonialMutation.isPending}
                              className="ui-button-primary px-5 py-2.5 text-xs font-bold shrink-0 w-full sm:w-auto"
                            >
                              {submitTestimonialMutation.isPending ? 'Submitting Review...' : 'Submit Review'}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* FAQ listing */}
                    {(() => {
                      const defaultFaqs = [
                        {
                          question: {
                            en: 'Is this program suitable for absolute beginners?',
                            hi: 'क्या यह कार्यक्रम शुरुआती लोगों के लिए उपयुक्त है?',
                            gu: 'શું આ કાર્યક્રમ સંપૂર્ણ શરૂઆત કરનારાઓ માટે યોગ્ય છે?'
                          },
                          answer: {
                            en: 'Yes! The curriculum is designed hierarchically, starting from basic finger counting up to multi-digit Soroban calculations.',
                            hi: 'हां! पाठ्यक्रम को पदानुक्रमित रूप से तैयार किया गया है, जो बुनियादी उंगली गणना से शुरू होकर बहु-अंकीय सोरोबन गणना तक जाता है।',
                            gu: 'હા! અભ્યાસક્રમ તબક્કાવાર રીતે ડિઝાઇન કરવામાં આવ્યો છે, જે મૂળભૂત આંગળી ગણતરીથી શરૂ કરીને મલ્ટિ-ડિજિટ સોરોબન ગણતરીઓ સુધી જાય છે।'
                          }
                        },
                        {
                          question: {
                            en: 'How does the classroom assessment work?',
                            hi: 'कक्षा मूल्यांकन कैसे काम करता है?',
                            gu: 'વર્ગખંડનું મૂલ્યાંકન કેવી રીતે કાર્ય કરે છે?'
                          },
                          answer: {
                            en: 'Each lesson is locked by default. Students must pass the lesson assessment exam with at least 60% score to unlock subsequent lessons.',
                            hi: 'प्रत्येक पाठ डिफ़ॉल्ट रूप से लॉक होता है। बाद के पाठों को अनलॉक करने के लिए छात्रों को कम से कम 60% स्कोर के साथ पाठ मूल्यांकन परीक्षा उत्तीर्ण करनी होगी।',
                            gu: 'દરેક પાઠ મૂળભૂત રીતે લૉક કરેલ હોય છે. આગળના પાઠો અનલૉક કરવા માટે વિદ્યાર્થીઓએ પાઠ મૂલ્યાંકન પરીક્ષામાં ઓછામાં ઓછા 60% સ્કોર સાથે પાસ થવું આવશ્યક છે।'
                          }
                        },
                        {
                          question: {
                            en: 'Will I receive a completion certificate?',
                            hi: 'क्या मुझे पूर्णता प्रमाण पत्र प्राप्त होगा?',
                            gu: 'શું મને પૂર્ણાહુતિ પ્રમાણપત્ર મળશે?'
                          },
                          answer: {
                            en: 'Yes. Once you complete the entire syllabus and pass the final course evaluation, a certificate of achievement will be unlocked for download.',
                            hi: 'हां। एक बार जब आप संपूर्ण पाठ्यक्रम पूरा कर लेते हैं और अंतिम पाठ्यक्रम मूल्यांकन उत्तीर्ण कर लेते हैं, तो उपलब्धि का प्रमाण पत्र डाउनलोड के लिए अनलॉक हो जाएगा।',
                            gu: 'હા. એકવાર તમે આખો અભ્યાસક્રમ પૂર્ણ કરી લો અને અંતિમ અભ્યાસક્રમ મૂલ્યાંકન પાસ કરી લો, પછી સિદ્ધિનું પ્રમાણપત્ર ડાઉનલોડ કરવા માટે અનલૉક થઈ જશે।'
                          }
                        }
                      ];

                      const faqsList = isWorkshop
                        ? (item.workshopFAQ && item.workshopFAQ.length > 0 ? item.workshopFAQ : defaultFaqs)
                        : (dbFAQs.length > 0 ? dbFAQs : defaultFaqs);

                      return faqsList.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-800/40 pb-4">
                            <h3 className="font-display font-extrabold text-base text-slate-855 dark:text-white">
                              Frequently Asked Questions
                            </h3>
                            
                            {/* Premium language switcher tabs */}
                            <div className="flex bg-slate-100 dark:bg-page-dark p-1 rounded-xl border border-orange-100/50 dark:border-slate-800 shadow-xs text-[10px] font-black self-start sm:self-auto">
                              {[
                                { code: 'en', label: 'English (EN)' },
                                { code: 'hi', label: 'हिन्दी (HI)' },
                                { code: 'gu', label: 'ગુજરાતી (GU)' }
                              ].map((lang) => (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => setFaqLanguage(lang.code as 'en' | 'hi' | 'gu')}
                                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    faqLanguage === lang.code
                                      ? 'bg-brand-primary text-white shadow-xs'
                                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                  }`}
                                >
                                  {lang.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {faqsList.map((faq: any, idx: number) => {
                              const questionText = faq.question?.[faqLanguage] || faq.question?.en || faq.question || '';
                              const answerText = faq.answer?.[faqLanguage] || faq.answer?.en || faq.answer || '';
                              
                              if (!questionText && !answerText) return null;

                              return (
                                <div 
                                  key={idx}
                                  className="ui-card space-y-2 p-4.5"
                                >
                                  <h4 className="font-extrabold text-xs text-slate-805 dark:text-slate-200 flex gap-2">
                                    <span>❓</span> {questionText}
                                  </h4>
                                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed pl-6 whitespace-pre-line text-justify">
                                    {answerText}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="ui-card border border-dashed text-center text-slate-400 text-xs p-6">
                          No FAQs available yet.
                        </div>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Right Checkout Panel (1/3 Column) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 ui-card space-y-6 p-6">
              
              {/* Thumbnail */}
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-page-dark relative group">
                <img
                  src={item.image || (isWorkshop ? FALLBACK_WORKSHOP_IMAGE : FALLBACK_COURSE_IMAGE)}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => handleImageError(e, isWorkshop ? FALLBACK_WORKSHOP_IMAGE : FALLBACK_COURSE_IMAGE)}
                />
                
                {/* Play hover overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <div className="w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={20} className="fill-current ml-0.5" />
                  </div>
                </div>

                {isPurchased ? (
                  <div className={`absolute top-2.5 right-2.5 px-3 py-1 rounded-full text-xs font-black shadow-md ${
                    isAccessExpired
                      ? 'bg-red-600 text-white'
                      : hasAccessExpiry && daysRemaining !== null
                        ? daysRemaining <= 7 ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                        : 'bg-emerald-600 text-white'
                  }`}>
                    {isAccessExpired
                      ? 'Expired'
                      : hasAccessExpiry && daysRemaining !== null
                        ? `${daysRemaining}d left`
                        : 'Enrolled'}
                  </div>
                ) : (
                  <div className="absolute top-2.5 right-2.5 px-3 py-1 bg-brand-primary text-white rounded-full text-xs font-black shadow-md">
                    ₹{price}
                  </div>
                )}
              </div>

              {/* Pricing details */}
              {!isPurchased && (
                <div className="space-y-1 border-b dark:border-slate-855 pb-4">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Program Cost</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      ₹{price}
                    </span>
                    {item.mrpPrice && item.mrpPrice > price && (
                      <>
                        <span className="text-sm text-slate-450 line-through">
                          ₹{item.mrpPrice}
                        </span>
                        <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-black px-2 py-0.5 rounded">
                          {Math.round(((item.mrpPrice - price) / item.mrpPrice) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Value checklist */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">This program includes:</span>
                <div className="space-y-2.5 text-xs text-slate-655 dark:text-slate-350">
                  {isWorkshop ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span>🎥</span> <span>Live Stream Interactive Classes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📄</span> <span>PDF Worksheets & Attachments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💬</span> <span>Live Q&A and Chat Support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⏰</span> <span>Access Validity: {item.validFor || 'Lifetime'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span>🎬</span> <span>Self-paced Video Modules</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📄</span> <span>Downloadable Study Notes & PDFs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>⚡</span> <span>Lesson Assessments & Exams</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🏆</span> <span>Completion Award Certificate</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Secure guarantee badge */}
              {!isPurchased && (
                <div className="flex gap-3 p-3 bg-slate-50 dark:bg-page-dark/60 rounded-2xl border dark:border-slate-800">
                  <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Secure Enrollment</span>
                    <span className="block text-[10px] text-slate-400 leading-normal">Refundable within 7 days of purchase.</span>
                  </div>
                </div>
              )}

              {/* Access info box for purchased courses */}
              {isPurchased && !isWorkshop && (
                <div className={`flex gap-3 p-3 rounded-2xl border ${
                  isAccessExpired
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                }`}>
                  <span className="text-lg shrink-0">{isAccessExpired ? '⏰' : '✅'}</span>
                  <div className="space-y-0.5">
                    <span className={`block text-xs font-bold ${
                      isAccessExpired ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {isAccessExpired
                        ? 'Access Expired'
                        : hasAccessExpiry && daysRemaining !== null
                          ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                          : 'Lifetime Access'}
                    </span>
                    <span className="block text-[10px] text-slate-400 leading-normal">
                      {isAccessExpired
                        ? 'Your access has ended. Purchase again to continue.'
                        : hasAccessExpiry && accessExpiryDate
                          ? `Expires on ${new Date(accessExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : 'You have unlimited access to this course.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {isPurchased && !isAccessExpired ? (
                <Link
                  to={isWorkshop ? `/workshop-lms/${item._id}` : `/lms/${item._id}`}
                  className="ui-button-primary w-full py-3.5 text-sm gap-2"
                >
                  <span>{isWorkshop ? 'Enter Stream Classroom' : 'Resume Learning'}</span>
                  <ArrowRight size={16} />
                </Link>
              ) : isPurchased && isAccessExpired ? (
                <button
                  onClick={handleCheckout}
                  disabled={purchasing}
                  className="ui-button-primary w-full py-3.5 text-sm gap-2 bg-red-655 hover:bg-red-500 shadow-red-200"
                >
                  <span>{purchasing ? 'Processing...' : 'Renew Access'}</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={purchasing}
                  className="ui-button-primary w-full py-3.5 text-sm gap-2"
                >
                  <span>{purchasing ? 'Processing Checkout...' : 'Purchase Program'}</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

        </div>
      </motion.div>

      {/* MOCK PAYMENT SIMULATOR MODAL */}
      <AnimatePresence>
        {showSimulateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="ui-card max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 text-3xl mx-auto">
                  💳
                </div>
                <h3 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
                  Payment Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Razorpay offline fallback
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-page-dark rounded-2xl border dark:border-slate-800 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Program:</span>
                  <span className="font-bold text-slate-805 dark:text-slate-200">{name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount Due:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">₹{price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-405">Payment Prefill:</span>
                  <span className="text-xs text-slate-500">{student?.phoneNumber}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-normal text-center bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-xl">
                This is a secure local simulation that will make the correct subscription API calls to enroll you in this course/workshop without a real Razorpay credit card.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSimulateModal(false)}
                  className="flex-1 py-3 rounded-xl border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulatePayment}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
                >
                  Simulate Success
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
