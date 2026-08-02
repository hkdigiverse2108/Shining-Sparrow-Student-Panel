import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useSubmitTestimonial } from '../hooks/useSettings';
import { MessageSquare, Star, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

export const FeedbackPage = () => {
  const { student } = useAuth();
  const { showToast } = useToast();
  const submitTestimonialMutation = useSubmitTestimonial();

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      showToast('Please enter your review.', 'warning');
      return;
    }
    setSubmitting(true);
    submitTestimonialMutation.mutate(
      {
        name: student?.fullName || 'Student',
        description: reviewText,
        rate: rating,
        type: 'home',
        learningCatalogId: undefined as any,
      },
      {
        onSuccess: () => {
          showToast('Thank you for your feedback! 🌟', 'success');
          setReviewText('');
          setFeedbackSuccess(true);
          setSubmitting(false);
        },
        onError: () => {
          showToast('Failed to submit feedback. Please try again.', 'error');
          setSubmitting(false);
        }
      }
    );
  };

  return (
    <div className="w-full min-h-[85vh]">
      <motion.div
        variants={pageChildVariants}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white leading-tight">
                Reviews & Feedback
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We value your thoughts! Share your experience with our platform & courses.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Card */}
        <div className="ui-card p-6 sm:p-10 space-y-6">
          <div className="border-b dark:border-slate-800 pb-4">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" size={20} />
              Share Your Overall Experience
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your valuable review helps us improve our teaching and may be featured on our website homepage!
            </p>
          </div>

          {feedbackSuccess ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-3xl text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-xl text-emerald-900 dark:text-emerald-300">
                  Thank You for Your Feedback!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                  We appreciate you taking the time to share your review. Your input helps us make learning even better for everyone.
                </p>
              </div>
              <button
                onClick={() => setFeedbackSuccess(false)}
                className="ui-button-outline px-6 py-2.5 text-xs font-bold mt-2"
              >
                Submit Another Review
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Overall Rating
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 max-w-full w-fit">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-2xl transition-transform hover:scale-125 focus:outline-none p-0.5 cursor-pointer"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        {star <= rating ? (
                          <span className="text-amber-500">★</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">☆</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">
                    {rating} out of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                  Your Review / Detailed Feedback *
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us what you loved about our classes, teachers, or platform..."
                  className="ui-input py-3 min-h-[140px] text-sm w-full"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-button-primary w-full sm:w-auto px-8 py-3.5 text-sm gap-2"
                >
                  <Send size={16} />
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
