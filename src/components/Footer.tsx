import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import settingsService from '../services/settings.service';
import { useToast } from '../context/ToastContext';
import { Mail, ArrowRight, Heart } from 'lucide-react';

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      const response = await settingsService.subscribeNewsletter({ email });
      if (response && response.status === 200) {
        showToast('Successfully subscribed to our newsletter!', 'success');
        setEmail('');
      } else {
        showToast(response.message || 'Subscription failed', 'error');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to subscribe. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-xl tracking-tight text-white">
              <span>✨</span>
              <span>Shining-Sparrow</span>
            </Link>
            <p className="text-sm max-w-sm leading-relaxed text-slate-400">
              Shining-Sparrow is an e-learning platform specializing in **Finger Math** (abacus-style arithmetic using fingers) for school-aged kids and adult learners. Learn computation faster, naturally.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Course Catalog</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Login / Portal</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">Student Sign Up</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscribe */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Stay Updated</h4>
            <p className="text-sm text-slate-400">Subscribe to our newsletter for math tricks and course announcements.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="p-2.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} Shining-Sparrow. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-rose-500 fill-current animate-pulse" /> for future math wizards.
          </p>
        </div>
      </div>
    </footer>
  );
};
