import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Phone, Key, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

export const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otr, setOtr] = useState('');
  const [loading, setLoading] = useState(false);

  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !otr) {
      showToast('Please enter both Phone Number and OTR code.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ phoneNumber, otr });
      if (response && response.status === 200) {
        showToast('Login successful! Welcome back.', 'success');
        navigate(from, { replace: true });
      } else {
        showToast(response.message || 'Login failed', 'error');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Invalid phone number or OTR code.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
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
            Student Classroom Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in with your phone number and OTR code
          </p>
        </div>

        {/* Form */}
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
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                className="ui-input pl-11 font-semibold"
              />
            </div>
          </div>

          {/* OTR Code */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500">
                OTR (One Time Registration) Code
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="ui-button-primary w-full py-3.5 text-sm"
          >
            {loading ? 'Entering classroom...' : 'Enter Classroom'}
          </button>
        </form>

        {/* Switch to signup */}
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
