import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from '../hooks/useCourses';
import { useWorkshops } from '../hooks/useWorkshops';
import { useHeroBanners, useTestimonials, useFAQs } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { CardSkeleton } from '../components/Loader';
import { Search, ChevronDown, ChevronRight, BookOpen, Video, Award, Star, Languages, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import { getImageUrl } from '../utils/fallbacks';

type FaqLang = 'en' | 'hi' | 'gu';

interface Course {
  _id: string;
  name: string;
  image?: string;
  price: number;
  mrpPrice?: number;
  enrolledLearners?: number;
  satisfactionRate?: number;
  description?: string;
}

interface Workshop {
  _id: string;
  title: string;
  subTitle?: string;
  image?: string;
  price: number;
  mrpPrice?: number;
  about?: string;
  duration?: string;
}

interface Testimonial {
  _id: string;
  description: string;
  name: string;
  designation?: string;
  image?: string;
  rate?: number;
}

interface FAQ {
  _id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState<'courses' | 'workshops'>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [faqLang, setFaqLang] = useState<FaqLang>('en');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  
  // Data Queries
  const { data: coursesData, isLoading: coursesLoading } = useCourses({ 
    page: 1, 
    limit: 12,
    search: searchQuery 
  });
  
  const { data: workshopsData, isLoading: workshopsLoading } = useWorkshops({ 
    page: 1, 
    limit: 12,
    search: searchQuery 
  });

  const { data: bannerData } = useHeroBanners({ page: 1, limit: 5 });
  const { data: testimonialData } = useTestimonials({ page: 1, limit: 6 });
  const { data: faqData } = useFAQs({ page: 1, limit: 10 });

  // Banner extraction
  const banners = bannerData?.data?.hero_banner_data || [];
  const bannerImages = banners.length > 0 && banners[0].images ? banners[0].images : [];

  // Toggle FAQ
  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Safe FAQ field retriever
  const getFaqText = (field: Record<string, string> | null | undefined, lang: FaqLang) => {
    if (!field) return '';
    return field[lang] || field['en'] || '';
  };

  return (
    <motion.div
      variants={pageChildVariants}
      initial="initial"
      animate="animate"
      className="space-y-16 pb-20"
    >
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-indigo-900 via-slate-900 to-cyan-900 text-white rounded-b-[40px] px-6 py-20 md:py-28 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-size-[16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ⚡ E-Learning Redefined
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-tight tracking-tight">
              Master calculation <br />
              <span className="bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                With Your Fingers
              </span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Unlock the secrets of Finger Math and abacus arithmetic. Perfect for children to build confidence, mental agility, and calculation speed without calculators!
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-8 py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-500/20 transition-all text-sm"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="px-8 py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-500/20 transition-all text-sm"
                  >
                    Start Free Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-all text-sm text-slate-200"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Banner Images Carousel/Viewer */}
          <div className="relative flex justify-center">
            {bannerImages.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800/80 glass-premium"
              >
                <img
                  src={bannerImages[0]}
                  alt="Finger Math Presentation"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ) : (
              <div className="w-full max-w-md h-80 rounded-3xl overflow-hidden shadow-2xl bg-linear-to-tr from-indigo-800/40 to-cyan-800/40 border border-white/10 backdrop-blur flex items-center justify-center">
                <div className="text-center space-y-2 p-6">
                  <div className="text-5xl animate-bounce">⚡</div>
                  <h3 className="font-display font-semibold text-lg">Interactive Learning</h3>
                  <p className="text-xs text-slate-400">Audio, image, calculation questions with instant evaluation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Catalog Search & Filtering */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-xl mx-auto mb-10">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-900 dark:text-white">
            Explore Programs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose from structural courses with lesson locking or linear workshops to master finger counting.
          </p>
        </div>

        {/* Search input and tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-3xl mx-auto mb-8">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'courses'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen size={16} />
              Courses
            </button>
            <button
              onClick={() => setActiveTab('workshops')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'workshops'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Video size={16} />
              Workshops
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Content list Grid */}
        <div>
          {activeTab === 'courses' ? (
            coursesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => <CardSkeleton key={n} />)}
              </div>
            ) : coursesData?.data?.course_data?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesData.data.course_data.map((course: Course) => (
                  <motion.div
                    key={course._id}
                    whileHover={{ y: -5 }}
                    className="flex flex-col bg-white border dark:bg-slate-800 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative">
                      <img
                        src={getImageUrl(course.image) || 'https://images.unsplash.com/photo-1596495578065-6e076b8df1d8?q=80&w=600'}
                        alt={course.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                        {(course.mrpPrice || 0) > 0 && (course.price || 0) > (course.mrpPrice || 0) ? (
                          <>
                            <span className="line-through opacity-70">₹{course.price}</span>
                            <span>₹{course.mrpPrice}</span>
                          </>
                        ) : (
                          <span>{course.price === 0 ? 'Free' : `₹${course.price}`}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                          {course.name}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <span>🎯 {course.enrolledLearners || 0} enrolled</span>
                          <span>•</span>
                          <span>🌟 {course.satisfactionRate || 98}% satisfied</span>
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                          {stripHtml(course.description || '')}
                        </p>
                      </div>

                      <div className="pt-4 border-t dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Lesson Locked Mode</span>
                        <Link
                          to={`/courses/${course._id}`}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-xl text-xs font-bold transition-all"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">No courses found matching "{searchQuery}"</div>
            )
          ) : (
            workshopsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => <CardSkeleton key={n} />)}
              </div>
            ) : workshopsData?.data?.workshop_data?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {workshopsData.data.workshop_data.map((workshop: Workshop) => (
                  <motion.div
                    key={workshop._id}
                    whileHover={{ y: -5 }}
                    className="flex flex-col bg-white border dark:bg-slate-800 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative">
                      <img
                        src={getImageUrl(workshop.image) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'}
                        alt={workshop.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                        {(workshop.mrpPrice || 0) > 0 && (workshop.mrpPrice || 0) > (workshop.price || 0) ? (
                          <>
                            <span className="line-through opacity-70">₹{workshop.mrpPrice}</span>
                            <span>₹{workshop.price}</span>
                          </>
                        ) : (
                          <span>{workshop.price === 0 ? 'Free' : `₹${workshop.price}`}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                          {workshop.title}
                        </h3>
                        <p className="text-xs text-indigo-500 font-semibold mt-1">
                          {workshop.subTitle || 'Math Mastery Workshop'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                          {stripHtml(workshop.about || '')}
                        </p>
                      </div>

                      <div className="pt-4 border-t dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs text-indigo-500 font-semibold">{workshop.duration || 'Flexible duration'}</span>
                        <Link
                          to={`/courses/${workshop._id}?type=workshop`}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-xl text-xs font-bold transition-all"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">No workshops found matching "{searchQuery}"</div>
            )
          )}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-slate-100 dark:bg-slate-900/60 py-16 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 h-fit">
                <Languages size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Multi-lingual Learning</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Toggle course content and FAQs easily between English, Hindi, and Gujarati options.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 h-fit">
                <Award size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Lesson Exam Unlocks</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Test your understanding dynamically. Unlock each subsequent lesson only after passing the current lesson's exam.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 h-fit">
                <Star size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Interactive Timed Exams</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Support for calculation, audio, text, and image questions with countdown submission pressure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonialData?.data?.testimonial_data?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-12">
            <h2 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
              Loved by Students & Parents
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Read how Shining-Sparrow is boosting mental calculation skills across standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialData.data.testimonial_data.map((test: Testimonial) => (
              <div
                key={test._id}
                className="bg-white border dark:bg-slate-800 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4"
              >
                <p className="text-sm italic text-slate-600 dark:text-slate-300">
                  "{test.description}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t dark:border-slate-700">
                  <img
                    src={getImageUrl(test.image) || 'https://api.dicebear.com/7.x/initials/svg?seed=' + test.name}
                    alt={test.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{test.name}</h4>
                    <p className="text-xs text-slate-400">{test.designation || 'Learner'}</p>
                    <div className="flex text-amber-400 mt-1">
                      {Array.from({ length: test.rate || 5 }).map((_, i) => (
                        <Star key={i} size={12} className="fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs Section with language selector */}
      {faqData?.data?.faq_data?.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="text-indigo-600 dark:text-indigo-400" />
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clear your doubts about finger math and workshops.</p>
            </div>
            
            {/* Lang switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['en', 'hi', 'gu'] as FaqLang[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setFaqLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                    faqLang === lang
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'ગુજરાતી'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {faqData.data.faq_data.map((faq: FAQ) => {
              const isOpen = openFaqId === faq._id;
              return (
                <div
                  key={faq._id}
                  className="bg-white border dark:bg-slate-800/40 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(faq._id)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <span>{getFaqText(faq.question, faqLang)}</span>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                          {getFaqText(faq.answer, faqLang)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </motion.div>
  );
};
