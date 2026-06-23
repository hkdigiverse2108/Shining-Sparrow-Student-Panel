import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlog } from '../hooks/useBlogs';
import { Loader } from '../components/Loader';
import { ArrowLeft, Clock, User, Bookmark, Quote, Calendar } from 'lucide-react';
import { handleImageError, getAvatarFallback } from '../utils/fallbacks';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

const FALLBACK_BLOG_IMAGE = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200';

export const BlogDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: blogRes, isLoading, error } = useBlog(id || '');
  const blog = blogRes?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-page-dark flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="text-center py-20 min-h-screen bg-slate-50 dark:bg-page-dark flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Article not found</h2>
        <p className="text-slate-505 mt-2 mb-6">The blog post you are looking for could not be found or has been deleted.</p>
        <Link 
          to="/dashboard?tab=blogs"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl text-xs shadow-md transition-colors"
        >
          <ArrowLeft size={14} /> Back to Blogs
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-50 dark:bg-page-dark transition-colors duration-200">
      
      {/* Back navigation header (Aligned with standard max-w-7xl grid) */}
      <motion.div variants={pageChildVariants} className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => navigate('/dashboard?tab=blogs')}
          className="inline-flex items-center gap-2 px-4 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-xs font-bold shadow-xs cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </motion.div>

      {/* Main Container - max-w-7xl responsive columns */}
      <motion.main variants={pageChildVariants} className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Main Article Content (Left 2/3 Column) */}
          <article className="lg:col-span-2 bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(232,100,36,0.02)] transition-shadow duration-300">
            
            {/* Cover Image */}
            <div className="h-64 sm:h-96 w-full relative overflow-hidden bg-slate-100 dark:bg-page-dark border-b dark:border-slate-800">
              <img
                src={blog.coverImage || blog.mainImage || FALLBACK_BLOG_IMAGE}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, FALLBACK_BLOG_IMAGE)}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              
              {blog.category && (
                <span className="absolute bottom-4 left-6 px-3.5 py-1.5 bg-brand-primary text-white rounded-lg text-xs font-black tracking-wide uppercase shadow-md">
                  🏷️ {blog.category}
                </span>
              )}
            </div>

            {/* Text Content Area */}
            <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
              
              {/* Header Meta */}
              <div className="space-y-4">
                <h1 className="font-display font-black text-2xl sm:text-4xl text-slate-900 dark:text-white leading-tight tracking-tight">
                  {blog.title}
                </h1>
                
                {blog.subTitle && (
                  <p className="text-brand-secondary font-bold text-sm sm:text-base tracking-wide leading-relaxed">
                    {blog.subTitle}
                  </p>
                )}

                {/* Author & Publish Date Row (Mobile Only, Desktop will have Sidebar) */}
                <div className="flex flex-wrap items-center gap-4 pt-3 border-b dark:border-slate-800 pb-5 text-xs text-slate-500 lg:hidden">
                  <div className="flex items-center gap-2">
                    <img
                      src={getAvatarFallback(blog.author || 'Shining-Sparrow Team')}
                      alt={blog.author || 'Author'}
                      className="w-8 h-8 rounded-full border dark:border-slate-700"
                    />
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-slate-200">
                        {blog.author || 'Shining-Sparrow Team'}
                      </span>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Clock size={14} className="text-brand-primary shrink-0" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              {blog.content && (
                <div 
                  className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed space-y-4 font-medium text-justify rich-text-content"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              )}

              {/* Quote Box Callout */}
              {blog.quote && (
                <div className="relative p-6 sm:p-8 bg-orange-50/20 dark:bg-orange-950/10 border-l-4 border-brand-primary rounded-r-3xl my-6">
                  <Quote size={32} className="absolute top-4 right-6 text-brand-primary/10 rotate-180" />
                  <p className="font-display italic font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed relative z-10">
                    "{blog.quote}"
                  </p>
                  <span className="block text-[11px] font-black uppercase text-brand-primary tracking-wider mt-3">
                    — Wise words
                  </span>
                </div>
              )}
            </div>
          </article>

          {/* Right Sidebar Column (1/3 Column) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Sidebar Card 1: About the Author */}
            <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <User size={16} className="text-brand-primary" /> About The Author
              </h3>
              
              <div className="flex items-center gap-3 pt-2">
                <img
                  src={getAvatarFallback(blog.author || 'Shining-Sparrow Team')}
                  alt={blog.author || 'Author'}
                  className="w-12 h-12 rounded-full border dark:border-slate-700 bg-orange-50"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-805 dark:text-slate-200">
                    {blog.author || 'Shining-Sparrow Team'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Senior Math Instructor</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed pt-2 border-t dark:border-slate-800/40">
                Dedicated to helping students master the art of speed calculations, abacus operations, and mental math visualization.
              </p>
            </div>

            {/* Sidebar Card 2: Article Info & Quick Stats */}
            <div className="bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Bookmark size={16} className="text-brand-primary" /> Article Details
              </h3>
              
              <div className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400 pt-2">
                <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-800/40">
                  <span className="font-semibold flex items-center gap-1.5"><Calendar size={14} /> Published</span>
                  <span className="font-bold text-slate-700 dark:text-slate-400">{formattedDate}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-800/40">
                  <span className="font-semibold flex items-center gap-1.5">🏷️ Category</span>
                  <span className="font-bold text-brand-primary uppercase tracking-wide text-[10px] bg-brand-primary/10 px-2 py-0.5 rounded">
                    {blog.category || 'General'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-semibold flex items-center gap-1.5"><Clock size={14} /> Read Time</span>
                  <span className="font-bold text-slate-700 dark:text-slate-400">3-4 min read</span>
                </div>
              </div>

              <Link
                to="/dashboard?tab=blogs"
                className="w-full text-center py-3 bg-orange-50 hover:bg-orange-100 text-brand-primary dark:bg-brand-primary/10 dark:hover:bg-brand-primary/20 dark:text-brand-secondary font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-orange-100/20"
              >
                Read More Articles
              </Link>
            </div>
          </div>

        </div>
      </motion.main>
    </div>
  );
};
