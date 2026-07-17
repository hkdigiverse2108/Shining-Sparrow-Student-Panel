import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCourse, usePurchaseCourse, useMyCourses } from '../hooks/useCourses';
import { useWorkshop, usePurchaseWorkshop, useMyWorkshops } from '../hooks/useWorkshops';
import { useWorkshopProgress } from '../hooks/useLMS';
import { useSettings, useFAQs, useSubmitTestimonial } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Loader } from '../components/Loader';
import { loadRazorpayScript } from '../utils/razorpay';
import { 
  handleImageError, FALLBACK_COURSE_IMAGE, FALLBACK_WORKSHOP_IMAGE, getImageUrl 
} from '../utils/fallbacks';
import { ArrowRight, Play, BookOpen, FileText, Award, Clock, Calendar, Check, ShieldCheck, Zap, Maximize2, Minimize2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import { useValidateCoupon } from '../hooks/useCoupons';

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

interface WorkshopTestimonial {
  _id: string;
  image?: string;
  name: string;
  designation?: string;
  description: string;
  rate?: number;
}

export interface LocalizedText {
  en: string;
  hi?: string;
  gu?: string;
}

export interface FAQ {
  question: string | Record<string, string>;
  answer: string | Record<string, string>;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

// Helper to parse YouTube URLs to embed URLs
const getEmbedUrl = (url: string) => {
  if (!url) return '';
  let embedUrl = url;
  if (!url.includes('youtube.com/embed/')) {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=2&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=0`;
    }
  } else {
    const separator = embedUrl.includes('?') ? '&' : '?';
    if (!embedUrl.includes('autoplay=')) {
      embedUrl = `${embedUrl}${separator}autoplay=1&controls=2&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=0`;
    } else if (!embedUrl.includes('controls=')) {
      embedUrl = `${embedUrl}&controls=2&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=0`;
    }
  }
  return embedUrl;
};


export const CourseDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isWorkshop = searchParams.get('type') === 'workshop';
  const navigate = useNavigate();
  
  // Fullscreen container logic for trailer video
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };
  
  const { isAuthenticated, student } = useAuth();
  const { showToast } = useToast();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'faqs'>('overview');
  const [faqLanguage, setFaqLanguage] = useState<'en' | 'hi' | 'gu'>('en');
  const [showTrailer, setShowTrailer] = useState(false);

  // Queries
  const { data: settingsData } = useSettings();
  const { data: courseData, isLoading: courseLoading } = useCourse(isWorkshop ? '' : id || '');
  const { data: workshopData, isLoading: workshopLoading } = useWorkshop(isWorkshop ? id || '' : '');
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

  // Workshop progress from API
  const { data: workshopProgressRes } = useWorkshopProgress(isWorkshop && isPurchased ? id || '' : '');
  const workshopProgress = workshopProgressRes?.data;


  // Mutations
  const purchaseCourseMutation = usePurchaseCourse();
  const purchaseWorkshopMutation = usePurchaseWorkshop();

  // Local state
  const [purchasing, setPurchasing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Coupon local states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [payablePrice, setPayablePrice] = useState<number | null>(null);
  const [couponError, setCouponError] = useState('');

  const validateCouponMutation = useValidateCoupon();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponError('');
    validateCouponMutation.mutate(
      {
        code: couponCode.trim().toUpperCase(),
        amount: price,
        appliesToId: id || undefined,
      },
      {
        onSuccess: (res) => {
          if (res.data) {
            setAppliedCoupon(res.data.coupon);
            setDiscountAmount(res.data.discountAmount);
            setPayablePrice(res.data.finalAmount);
            showToast('Coupon code applied successfully! 🎉', 'success');
          } else {
            setCouponError('Invalid coupon response.');
          }
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || 'Invalid or expired coupon code.';
          setCouponError(errMsg);
          showToast(errMsg, 'error');
        },
      }
    );
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setPayablePrice(null);
    setCouponCode('');
    setCouponError('');
    showToast('Coupon code removed.', 'info');
  };

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
        type: isWorkshop ? 'workshop' : 'course',
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


  const rawPrice = item.price;
  const rawMrp = item.mrpPrice;
  const hasPriceDiscount = rawMrp > 0 && rawMrp !== rawPrice;
  const price = hasPriceDiscount ? Math.min(rawPrice, rawMrp) : (rawPrice || 0);
  const mrpPrice = hasPriceDiscount ? Math.max(rawPrice, rawMrp) : (rawMrp || 0);
  const name = isWorkshop ? item.title : item.name;
  const description = isWorkshop ? item.about : item.description;
  const pdfUrl = isWorkshop ? item.pdfAttach : item.pdf;
  const courseLessonsCount = item && !isWorkshop ? (item.totalLesson || item.courseLessonIds?.length || 0) : 0;
  const courseLevelsCount = item && !isWorkshop ? (item.courseCurriculumIds?.length || 0) : 0;
  const currentEnrollment = isWorkshop 
    ? enrolledWorkshops.find((ew: EnrolledWorkshop) => ew.workshopId?._id === id)
    : enrolledCourses.find((ec: EnrolledCourse) => ec.courseId?._id === id);

  const completedLessons = isWorkshop
    ? (workshopProgress?.completedCount || 0)
    : (currentEnrollment ? (currentEnrollment as any).completedLessons || 0 : 0);
  const totalLessons = isWorkshop
    ? (workshopProgress?.totalCount || item?.workshopCurriculum?.length || 0)
    : (currentEnrollment ? (currentEnrollment as any).totalLesson || courseLessonsCount : courseLessonsCount);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      showToast('Please login to purchase this program.', 'warning');
      navigate('/login');
      return;
    }

    const finalPayable = payablePrice !== null ? payablePrice : price;

    if (finalPayable === 0) {
      setPurchasing(true);
      try {
        if (isWorkshop) {
          await purchaseWorkshopMutation.mutateAsync({
            workshop_id: item._id,
            amount: price,
            payment_id: `FREE_COUPON_${appliedCoupon?.code || 'OFFER'}`,
            final_amount: 0,
            payment_method: 'coupon',
            couponCodeId: appliedCoupon?._id || undefined,
            discountAmount: discountAmount,
          });
        } else {
          await purchaseCourseMutation.mutateAsync({
            courseId: item._id,
            razorpayOrderId: 'FREE_ORDER_' + Math.random().toString(36).substring(2, 9),
            razorpayPaymentId: `FREE_COUPON_${appliedCoupon?.code || 'OFFER'}`,
            couponCodeId: appliedCoupon?._id || undefined,
            discountAmount: discountAmount,
            finalAmount: 0,
          });
        }
        showToast('Enrollment successful!', 'success');
        navigate('/dashboard');
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        showToast(error.response?.data?.message || 'Enrollment failed. Contact support.', 'error');
      } finally {
        setPurchasing(false);
      }
      return;
    }

    setPurchasing(true);
    try {
      const razorpayKey = settingsData?.data?.razorpayKey;
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !razorpayKey) {
        showToast('Payment gateway is currently offline. Please try again later.', 'error');
        setPurchasing(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: finalPayable * 100,
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
                final_amount: finalPayable,
                payment_method: 'razorpay',
                couponCodeId: appliedCoupon?._id || undefined,
                discountAmount: discountAmount,
              });
            } else {
              await purchaseCourseMutation.mutateAsync({
                courseId: item._id,
                razorpayOrderId: response.razorpay_order_id || 'ORDER_' + Math.random().toString(36).substring(2, 9),
                razorpayPaymentId: response.razorpay_payment_id,
                couponCodeId: appliedCoupon?._id || undefined,
                discountAmount: discountAmount,
                finalAmount: finalPayable,
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
      showToast('Checkout failed. Please try again.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const handleOpenCheckout = () => {
    if (!isAuthenticated) {
      showToast('Please login to purchase this program.', 'warning');
      navigate('/login');
      return;
    }
    setShowCheckoutModal(true);
  };


  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-50 dark:bg-page-dark transition-colors duration-200">
      
      {/* 1. Immersive Hero Banner (Full width) */}
      <div className="w-full shrink-0 bg-linear-to-br from-slate-900 via-[#1f130d] to-slate-950 text-white border-b border-orange-500/10 relative overflow-hidden py-10 sm:py-14">
        {/* Abstract glowing ambient accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-brand-secondary/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div variants={pageChildVariants} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-slate-400">
            <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-brand-secondary flex items-center gap-1.5 border border-white/5 shadow-xs">
              {isWorkshop ? '🎥 Interactive Live Stream' : '📚 Structured Curriculum'}
            </span>
            {item.language && (
              <span className="px-3.5 py-1.5 bg-white/5 backdrop-blur-sm rounded-xl text-slate-300">
                🌐 {item.language}
              </span>
            )}
            <span className="px-3.5 py-1.5 bg-white/5 backdrop-blur-sm rounded-xl text-slate-400 flex items-center gap-1">
              ⭐ 4.9 (120+ ratings)
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-transparent bg-clip-text bg-linear-to-r from-white via-orange-100 to-brand-secondary leading-tight tracking-tight">
              {name}
            </h1>
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2">
            {item.enrolledLearners && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {item.enrolledLearners}+ Learners Enrolled
              </span>
            )}
            {item.satisfactionRate && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {item.satisfactionRate}% Satisfaction
              </span>
            )}
            {item.classCompleted && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-450" />
                {item.classCompleted}+ Classes Completed
              </span>
            )}
            {item.totalLesson && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {item.totalLesson} Lessons
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* 2. Main split page content */}
      <motion.div variants={pageChildVariants} className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
          
          {/* Main Details Panel (Left 2/3 Column) */}
          <div className="lg:col-span-2 space-y-8 min-w-0">
            
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
                    <div className="ui-card space-y-4 min-w-0 overflow-hidden w-full">
                      <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-white">
                        About this {isWorkshop ? 'Workshop' : 'Course'}
                      </h3>
                      <div 
                        className="rich-text-content text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
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



                    {/* Workshop details card (only shown for workshops) */}
                    {isWorkshop && (
                      <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                          <span className="text-lg">📋</span> Workshop Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
                          {item.duration && (
                            <div className="p-3.5 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/20 dark:border-slate-800/40 rounded-2xl space-y-1">
                              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Duration</span>
                              <span className="text-slate-800 dark:text-slate-200 font-black text-sm">{item.duration}</span>
                            </div>
                          )}
                          {item.language && (
                            <div className="p-3.5 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/20 dark:border-slate-800/40 rounded-2xl space-y-1">
                              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Language</span>
                              <span className="text-slate-800 dark:text-slate-200 font-black text-sm">{item.language}</span>
                            </div>
                          )}
                          {item.validFor && (
                            <div className="p-3.5 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100/20 dark:border-slate-800/40 rounded-2xl space-y-1">
                              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Validity</span>
                              <span className="text-slate-800 dark:text-slate-200 font-black text-sm">{item.validFor}</span>
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
                      <h3 className="font-display font-extrabold text-lg text-slate-800 dark:text-white">
                        Curriculum Syllabus Roadmap
                      </h3>
                      <p className="text-xs text-slate-450 dark:text-slate-400">
                        {isWorkshop ? 'Step-by-step live interactive lecture curriculum.' : 'Self-paced level-wise learning modules. Pass exams to unlock levels.'}
                      </p>
                    </div>

                    {/* SYLLABUS LIST */}
                    {isWorkshop ? (
                      item.workshopCurriculum && item.workshopCurriculum.length > 0 ? (
                        <div className="bg-white border border-orange-100 dark:bg-card-dark dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
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
                                      className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 py-1 hover:bg-orange-50/20 dark:hover:bg-slate-800/30 rounded-lg transition-colors"
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
                        <div className="bg-white border border-orange-100 dark:bg-card-dark dark:border-slate-800/60 rounded-3xl p-5 shadow-sm space-y-3.5">
                          {item.courseLessonIds.map((lesson: Lesson, idx: number) => (
                            <div 
                              key={lesson._id} 
                              className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800/40 pb-2.5 last:border-0 last:pb-0"
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
                    {/* Database-backed Testimonials / Reviews (shown for workshops and courses) */}
                    {((isWorkshop && item?.workshopTestimonials && item?.workshopTestimonials?.length > 0) ||
                      (!isWorkshop && item?.courseTestimonials && item?.courseTestimonials?.length > 0)) && (
                      <div className="space-y-4">
                        <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white">
                          What Students Say
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(isWorkshop ? item.workshopTestimonials : item.courseTestimonials || []).map((t: WorkshopTestimonial) => (
                            <div 
                              key={t._id} 
                              className="bg-white dark:bg-card-dark border border-orange-100/30 dark:border-slate-800/50 rounded-2xl p-4.5 space-y-3 hover:shadow-sm transition-shadow"
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
                    {isAuthenticated && isPurchased && (
                      <div className="ui-card space-y-5">
                        <div className="border-b dark:border-slate-800 pb-3">
                          <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white">
                            Share Your Experience
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Since you've enrolled in this {isWorkshop ? 'workshop' : 'course'}, we would love to hear your feedback!
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
                      const faqsList = dbFAQs;

                      return faqsList.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-800/40 pb-4">
                            <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white">
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
                            {faqsList.map((faq: FAQ, idx: number) => {
                              const questionText = typeof faq.question === 'string' ? faq.question : (faq.question?.[faqLanguage] || faq.question?.en || '');
                              const answerText = typeof faq.answer === 'string' ? faq.answer : (faq.answer?.[faqLanguage] || faq.answer?.en || '');
                              
                              if (!questionText && !answerText) return null;

                              return (
                                <div 
                                  key={idx}
                                  className="ui-card space-y-2 p-4.5"
                                >
                                  <h4 className="font-extrabold text-xs text-slate-805 dark:text-slate-200 flex gap-2">
                                    <span>❓</span> {questionText}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6 whitespace-pre-line text-justify">
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
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="glass-premium rounded-3xl overflow-hidden border border-brand-primary/15 dark:border-slate-700/50 shadow-2xl shadow-brand-primary/10 dark:shadow-black/30">
                
                {/* Thumbnail with gradient overlay */}
                <div 
                  className={`w-full h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative group ${
                    !isWorkshop && item.trailerUrl ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (!isWorkshop && item.trailerUrl) {
                      setShowTrailer(true);
                    }
                  }}
                >
                  <img
                    src={getImageUrl(item.image) || (isWorkshop ? FALLBACK_WORKSHOP_IMAGE : FALLBACK_COURSE_IMAGE)}
                    alt={name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                    onError={(e) => handleImageError(e, isWorkshop ? FALLBACK_WORKSHOP_IMAGE : FALLBACK_COURSE_IMAGE)}
                  />
                  {/* Multi-layer gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10" />
                  
                  {/* Play hover overlay */}
                  {!isWorkshop && item.trailerUrl && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 bg-black/20">
                      <div className="w-16 h-16 bg-brand-primary/95 text-white rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300 backdrop-blur-sm ring-4 ring-white/20">
                        <Play size={24} className="fill-current ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Status badge - top right */}
                  {isPurchased ? (
                    <div className={`absolute top-3 right-3 px-4 py-2 rounded-2xl text-[11px] font-black shadow-lg backdrop-blur-md border border-white/20 ${
                      isAccessExpired
                        ? 'bg-red-500/95 text-white'
                        : hasAccessExpiry && daysRemaining !== null
                          ? daysRemaining <= 7 ? 'bg-amber-500/95 text-white animate-pulse' : 'bg-emerald-500/95 text-white'
                          : 'bg-emerald-500/95 text-white'
                    }`}>
                      {isAccessExpired
                        ? 'Expired'
                        : hasAccessExpiry && daysRemaining !== null
                          ? `${daysRemaining}d left`
                          : 'Enrolled'}
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 px-4 py-2 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-white rounded-2xl text-sm font-black shadow-xl backdrop-blur-md border border-white/20">
                      ₹{price}
                    </div>
                  )}

                  {/* Course type badge - bottom left */}
                  <div className="absolute bottom-3 left-3 px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-white rounded-2xl text-[10px] font-black shadow-lg border border-white/20">
                    {isWorkshop ? '🎥 Live Workshop' : '📚 Self-Paced Course'}
                  </div>

                  {/* Progress indicator on image - bottom right for purchased courses */}
                  {isPurchased && totalLessons > 0 && (
                    <div className="absolute bottom-3 right-3 px-3 py-2 bg-black/70 backdrop-blur-md text-white rounded-2xl text-[10px] font-black shadow-lg border border-white/10">
                      {progressPercent}% Complete
                    </div>
                  )}
                </div>

                {/* Welcoming Header */}
                <div className="px-5 sm:px-6 pt-4 pb-2 space-y-1.5">
                  {isPurchased ? (
                    <>
                      <span className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] block">
                        Welcome Back{student?.fullName ? `, ${student.fullName.split(' ')[0]}` : ''} 👋
                      </span>
                      <h3 className="font-display font-black text-xl sm:text-2xl text-slate-800 dark:text-white leading-tight tracking-tight">
                        Continue Learning
                      </h3>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] block">
                        Get Started Today
                      </span>
                      <h3 className="font-display font-black text-xl sm:text-2xl text-slate-800 dark:text-white leading-tight tracking-tight">
                        Enroll in this Program
                      </h3>
                    </>
                  )}
                </div>

                {/* Pricing details */}
                {!isPurchased && (
                  <div className="px-5 sm:px-6 space-y-3 border-b border-slate-100 dark:border-slate-700/50 pb-5">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] block">Total Program Cost</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        ₹{price}
                      </span>
                      {mrpPrice > 0 && mrpPrice > price && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400 line-through font-medium">
                            ₹{mrpPrice}
                          </span>
                          <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black px-2.5 py-1 rounded-xl shadow-sm">
                            {Math.round(((mrpPrice - price) / mrpPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Your Current Status Section */}
                {isPurchased && (
                  <div className="px-5 sm:px-6 space-y-3">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] block">Your Current Status</span>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 space-y-4">
                      <>
                        {/* Progress header with percentage */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {isWorkshop ? 'Sessions Completed' : 'Lessons Completed'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-brand-primary">{progressPercent}%</span>
                          </div>
                        </div>
                        
                        {/* Enhanced progress bar */}
                        <div className="relative">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-brand-primary to-orange-500 h-full rounded-full transition-all duration-700 ease-out relative"
                              style={{ width: `${progressPercent}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Lesson count */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 dark:text-slate-500">
                            {completedLessons} of {totalLessons} {isWorkshop ? 'sessions' : 'lessons'}
                          </span>
                          {progressPercent === 100 && (
                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                              <Check size={12} /> Completed
                            </span>
                          )}
                        </div>
                      </>
                      
                      {/* Access expiry */}
                      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Access Expiry</span>
                        <span className={`text-sm font-black ${
                          isAccessExpired ? 'text-red-500' : 
                          hasAccessExpiry && daysRemaining !== null && daysRemaining <= 7 ? 'text-amber-500' : 
                          'text-slate-800 dark:text-slate-200'
                        }`}>
                          {isAccessExpired
                            ? 'Expired'
                            : hasAccessExpiry && daysRemaining !== null
                              ? `${daysRemaining} days left`
                              : 'Lifetime Access'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Program Details Section */}
                <div className="px-5 sm:px-6 space-y-3">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] block">Program Details</span>
                  <div className="space-y-2.5">
                    {isWorkshop ? (
                      <>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                            <Play size={16} className="text-brand-primary fill-brand-primary/20" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Live Interactive Classes</span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-blue-500" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                            {item.workshopCurriculum?.length 
                              ? `${item.workshopCurriculum.length} Scheduled Sessions` 
                              : 'Live Interactive Sessions'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center shrink-0">
                            <Zap size={16} className="text-purple-500 fill-purple-500/20" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Live Q&A and Chat Support</span>
                        </div>
                        {pdfUrl && (
                          <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-emerald-500" />
                            </span>
                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Downloadable Workshop Syllabus</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-amber-500" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Access Validity: {item.validFor || 'Lifetime'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                            <BookOpen size={16} className="text-brand-primary" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                            {courseLessonsCount} Lessons & Video Modules
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center shrink-0">
                            <Zap size={16} className="text-purple-500 fill-purple-500/20" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                            {courseLevelsCount > 0 ? `${courseLevelsCount} Learning Levels` : 'Structured Curriculum Roadmap'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center shrink-0">
                            <Check size={16} className="text-blue-500 font-black" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Lesson Assessments & Exams</span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center shrink-0">
                            <Award size={16} className="text-emerald-500" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Completion Award Certificate</span>
                        </div>
                        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center shrink-0">
                            <Clock size={16} className="text-amber-500" />
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                            Access: {item.accessDurationDays ? `${item.accessDurationDays} Days Validity` : 'Lifetime Access'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
                  {isPurchased && !isAccessExpired ? (
                    <Link
                      to={isWorkshop ? `/workshop-lms/${item._id}` : `/lms/${item._id}`}
                      className="group relative w-full py-4 sm:py-4.5 text-sm font-black flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-primary to-orange-600 hover:from-orange-600 hover:to-brand-primary text-white rounded-2xl shadow-xl shadow-brand-primary/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="relative z-10">{isWorkshop ? 'Enter Stream Classroom' : 'Resume Learning'}</span>
                      <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : isPurchased && isAccessExpired ? (
                    <button
                      onClick={handleOpenCheckout}
                      disabled={purchasing}
                      className="w-full py-4 sm:py-4.5 text-sm font-black flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-2xl shadow-xl shadow-red-500/25 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{purchasing ? 'Processing...' : 'Renew Access'}</span>
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCheckout}
                      disabled={purchasing}
                      className="w-full py-4 sm:py-4.5 text-sm font-black flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-primary to-orange-600 hover:from-orange-600 hover:to-brand-primary text-white rounded-2xl shadow-xl shadow-brand-primary/30 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{purchasing ? 'Processing Checkout...' : 'Purchase Program'}</span>
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Trust badges below checkout card */}
              {!isPurchased && (
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-400 font-semibold px-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>100% Secure</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm">
                    <Zap size={12} className="text-amber-500" />
                    <span>Instant Access</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-sm">
                    <Check size={12} className="text-blue-500" />
                    <span>Cards, UPI & More</span>
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>

      {/* Trailer Video Modal */}
      <AnimatePresence>
        {showTrailer && item.trailerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors border border-white/10 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
              
              {/* Aspect Ratio Container for Iframe */}
              <div 
                ref={playerContainerRef}
                className="group relative aspect-video w-full"
                onClick={() => {
                  if (iframeRef.current) iframeRef.current.focus();
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={getEmbedUrl(item.trailerUrl)}
                  title={`${name} Trailer`}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                
                {/* Top bar visual shield + branding */}
                <div 
                  className="absolute top-0 left-0 right-0 h-14 bg-linear-to-b from-slate-950/90 to-slate-950/20 backdrop-blur-[2px] z-10 flex items-center px-6 pointer-events-none select-none animate-top-bar-fade group-hover:opacity-100! group-hover:backdrop-blur-[2px]! transition-all duration-500"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse"></span>
                    <span className="text-sm font-bold text-white tracking-wide truncate max-w-70 sm:max-w-md">
                      {name} Trailer
                    </span>
                  </div>
                </div>
                
                {/* Bottom-right visual shield + branding */}
                <div className="absolute bottom-3 right-3 z-10 pointer-events-none select-none">
                  <div className="px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-[9px] font-extrabold uppercase tracking-widest text-orange-200">
                    Shining Sparrow
                  </div>
                </div>

                {/* Invisible pointer-events overlays to capture clicks in key redirect regions */}
                <div className="absolute top-0 left-0 right-0 h-[16%] z-10 bg-transparent cursor-default pointer-events-auto" />
                <div className="absolute bottom-0 left-0 w-[20%] h-[16%] z-10 bg-transparent cursor-default pointer-events-auto" />
                <div className="absolute bottom-0 right-0 w-[38%] h-[16%] z-10 bg-transparent cursor-default pointer-events-auto" />

                {/* Custom Fullscreen Toggle Button */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute bottom-2 left-14 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm border border-white/20 shadow-lg cursor-pointer transition-colors"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Summary & Coupon Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  handleRemoveCoupon();
                }}
                className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>

              <div className="p-6 space-y-6">
                <div className="border-b dark:border-slate-800 pb-3">
                  <h3 className="font-display font-black text-lg text-slate-800 dark:text-white">
                    Checkout Summary
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Review your order and apply any promotional codes.
                  </p>
                </div>

                {/* Product Metadata Info */}
                <div className="flex gap-4 p-3 bg-slate-55 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <img
                    src={getImageUrl(item.image) || (isWorkshop ? FALLBACK_WORKSHOP_IMAGE : FALLBACK_COURSE_IMAGE)}
                    alt={name}
                    className="w-14 h-14 object-cover rounded-xl shrink-0"
                    onError={(e) => handleImageError(e, isWorkshop ? FALLBACK_WORKSHOP_IMAGE : FALLBACK_COURSE_IMAGE)}
                  />
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-black text-slate-800 dark:text-white line-clamp-2 leading-snug">
                      {name}
                    </p>
                    <span className="text-[9px] text-brand-primary font-black uppercase tracking-[0.1em] mt-1.5 block">
                      {isWorkshop ? '🎥 Live Workshop Stream' : '📚 Self-Paced Program'}
                    </span>
                  </div>
                </div>

                {/* Coupon Code section */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] block">Have a Coupon Code?</span>
                  
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER PROMO CODE"
                        className="grow px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-brand-primary transition-colors text-slate-800 dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={validateCouponMutation.isPending}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-950 dark:bg-brand-primary dark:hover:bg-brand-primary/95 text-white text-xs font-black rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {validateCouponMutation.isPending ? '...' : 'Apply'}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/40 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <Tag size={16} className="text-emerald-500 shrink-0 animate-bounce" />
                        <div>
                          <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            {appliedCoupon.code}
                          </p>
                          <p className="text-[10px] text-emerald-500 font-semibold">
                            Saved ₹{discountAmount.toFixed(2)} ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : 'flat'} off)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-red-500 hover:text-red-700 font-black tracking-wider hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  
                  {couponError && (
                    <p className="text-[10px] text-red-500 font-semibold pl-1">
                      ⚠️ {couponError}
                    </p>
                  )}
                </div>

                {/* Price Summary Breakdown */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-2.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Program Price</span>
                    <span className="text-slate-800 dark:text-slate-200">₹{price}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-500 font-semibold">
                      <span>Promo Code Discount</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-800/60 pt-3 flex justify-between items-baseline font-black text-slate-900 dark:text-white">
                    <span className="text-sm">Total Payable</span>
                    <span className="text-2xl text-brand-primary tracking-tight">
                      ₹{payablePrice !== null ? payablePrice : price}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleCheckout}
                    disabled={purchasing}
                    className="w-full py-4 text-sm font-black flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-primary to-orange-600 hover:from-orange-600 hover:to-brand-primary text-white rounded-2xl shadow-xl shadow-brand-primary/30 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>{purchasing ? 'Processing Order...' : 'Pay & Enroll Now'}</span>
                    <ArrowRight size={16} />
                  </button>
                  <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider block">
                    🔒 Secured Checkout & Instant Verification
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
