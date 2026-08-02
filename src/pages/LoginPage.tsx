import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Phone, Key, HelpCircle, Mail, Lock, ShieldCheck, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import authService from '../services/auth.service';

export const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otr, setOtr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotOtr, setShowForgotOtr] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [submittingForgot, setSubmittingForgot] = useState(false);
  const [showAutoFillMsg, setShowAutoFillMsg] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const redirectLms = queryParams.get('redirectLms');
  const redirectWorkshopLms = queryParams.get('redirectWorkshopLms');
  const from = redirectLms 
    ? `/lms/${redirectLms}` 
    : redirectWorkshopLms 
    ? `/workshop-lms/${redirectWorkshopLms}` 
    : ((location.state as any)?.from?.pathname || '/dashboard');

  // Auto-fill from URL query params (website enrollment) or state (signup)
  useEffect(() => {
    const signupState = location.state as any;

    const fromEnroll = queryParams.get('fromEnroll') === 'true';
    const fromSignup = signupState?.fromSignup;
    const autoPhone = signupState?.phoneNumber || queryParams.get('phoneNumber') || '';
    const autoOtr = signupState?.otr || queryParams.get('otr') || '';

    if (autoPhone) setPhoneNumber(autoPhone);
    if (autoOtr) setOtr(autoOtr);
    if ((fromEnroll || fromSignup) && autoOtr) {
      setShowAutoFillMsg(true);
    }
  }, [location.search, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!phoneNumber || !otr) {
        showToast('Please enter both Phone Number and OTR code.', 'warning');
        setLoading(false);
        return;
      }
      const response = await login({ phoneNumber, otr });

      if (response && response.status === 200) {
        showToast('Login successful! Welcome back.', 'success');
        navigate(from, { replace: true });
      } else {
        showToast(response.message || 'Login failed', 'error');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Invalid credentials.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotOtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your registered email address.', 'warning');
      return;
    }
    setSubmittingForgot(true);
    try {
      const res = await authService.forgotOtr(forgotEmail);
      showToast(res.message || 'OTR sent successfully to your registered email.', 'success');
      setShowForgotOtr(false);
      setForgotEmail('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to retrieve OTR.';
      showToast(errMsg, 'error');
    } finally {
      setSubmittingForgot(false);
    }
  };

  return (
    <motion.div
      variants={pageChildVariants}
      initial="initial"
      animate="animate"
      className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 space-y-6"
    >
      
      {/* Branded Logo Header */}
      <div className="text-center">
        <img
          src="/logo.png"
          alt="Shining-Sparrow"
          className="h-20 sm:h-24 object-contain mx-auto drop-shadow-md"
        />
      </div>

      <div className="ui-card p-8 max-w-md w-full space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            {showForgotOtr ? 'Retrieve Your OTR' : 'Student Classroom Access'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {showForgotOtr 
              ? 'Enter your registered email address to receive your OTR' 
              : 'Sign in with your phone number and OTR'}
          </p>
        </div>

        {/* Auto-fill info banner from signup */}
        <AnimatePresence>
          {showAutoFillMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-xl">
                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-300">
                    This is a one-time auto-fill from your registration.
                  </p>
                  <p className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Please save your OTR code safely. You will need it to login next time.
                  </p>
                </div>
                <button
                  onClick={() => setShowAutoFillMsg(false)}
                  className="p-1 rounded-full text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        {showForgotOtr ? (
          <form className="space-y-5" onSubmit={handleForgotOtrSubmit}>
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value.slice(0, 35))}
                  maxLength={35}
                  placeholder="student@example.com"
                  className="ui-input pl-11 font-semibold"
                />
              </div>
            </div>

            {/* Submit & Back buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={submittingForgot}
                className="ui-button-primary w-full py-3.5 text-sm"
              >
                {submittingForgot ? 'Sending...' : 'Send OTR'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotOtr(false);
                  setForgotEmail('');
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1 font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  placeholder="9876543210"
                  className="ui-input pl-11 font-semibold"
                />
              </div>
            </div>

            {/* OTR Code */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                  Your OTR
                </label>
                <div className="group relative">
                  <HelpCircle size={14} className="text-slate-400 hover:text-orange-500 cursor-help" />
                  <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded bg-slate-800 text-[10px] text-white leading-normal shadow-lg z-10">
                    This is the 8-digit registration code generated when you signed up.
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={otr}
                  onChange={(e) => setOtr(e.target.value)}
                  placeholder="38294710"
                  maxLength={8}
                  className="ui-input pl-11 tracking-widest font-mono font-extrabold"
                />
              </div>
              
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotOtr(true)}
                  className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline"
                >
                  Forgot OTR?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="ui-button-primary w-full py-3.5 text-sm"
            >
              {loading ? 'Signing in...' : 'Enter Classroom'}
            </button>
          </form>
        )}

        {/* Switch to signup (student only) */}
        <div className="text-center text-xs text-slate-500 mt-4!">
          New student?{' '}
          <Link to="/signup" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
