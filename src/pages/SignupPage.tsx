import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Mail, Phone, User, Landmark, School, Send, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

const REACH_SOURCES = [
  'Social Media',
  'Friend / Referral',
  'School Seminar',
  'Web Search',
  'Advertisement',
  'Other',
];

const STANDARD_OPTIONS = [
  '1st Std',
  '2nd Std',
  '3rd Std',
  '4th Std',
  '5th Std',
  '6th Std',
  '7th Std',
  '8th Std',
  '9th Std',
  '10th Std',
  'Adult Learner',
];

export const SignupPage = () => {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [std, setStd] = useState('5th Std');
  const [reachFrom, setReachFrom] = useState('Social Media');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [otrCode, setOtrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      showToast('You must agree to the Terms and Conditions.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await signup({
        fullName,
        email,
        phoneNumber,
        district,
        std,
        reachFrom,
        agreeTerms,
      });

      if (response && response.status === 200) {
        setOtrCode(response.data.otr);
        showToast('Registration successful! Save your OTR Code.', 'success');
      } else {
        showToast(response.message || 'Signup failed', 'error');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Something went wrong during signup. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOTR = () => {
    if (otrCode) {
      navigator.clipboard.writeText(otrCode);
      setCopied(true);
      showToast('OTR Code copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleModalClose = () => {
    setOtrCode(null);
    navigate('/login');
  };

  return (
    <motion.div
      variants={pageChildVariants}
      initial="initial"
      animate="animate"
      className="min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 space-y-6"
    >
      
      {/* Branded Logo Header */}
      <div className="text-center">
        <img
          src="/logo.png"
          alt="Shining-Sparrow"
          className="h-20 sm:h-22 object-contain mx-auto drop-shadow-sm"
        />
      </div>

      <div className="ui-card p-8 max-w-md w-full space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            Student Registration
          </h2>
          <p className="text-xs text-slate-505 dark:text-slate-400">
            Sign up to generate your unique classroom login code
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="ui-input pl-11 font-semibold"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="ui-input pl-11 font-semibold"
                />
              </div>
            </div>

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
          </div>

          {/* Std & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                Standard (Std)
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={std}
                  onChange={(e) => setStd(e.target.value)}
                  className="ui-input pl-11 appearance-none font-semibold cursor-pointer"
                >
                  {STANDARD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                District
              </label>
              <div className="relative">
                <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Surat"
                  className="ui-input pl-11 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Reach Source */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
              How did you hear about us?
            </label>
            <div className="relative">
              <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={reachFrom}
                onChange={(e) => setReachFrom(e.target.value)}
                className="ui-input pl-11 appearance-none font-semibold cursor-pointer"
              >
                {REACH_SOURCES.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Agree Terms */}
          <div className="flex items-start gap-2 pt-2">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-slate-350 dark:border-slate-700 rounded transition-colors"
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-500 dark:text-slate-400 select-none cursor-pointer">
              I agree to the Shining-Sparrow Terms of Service and Privacy Policy.
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="ui-button-primary w-full mt-4 py-3.5 text-sm"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Switch to login */}
        <div className="text-center text-xs text-slate-500 !mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>

      {/* OTR SUCCESS OVERLAY MODAL */}
      <AnimatePresence>
        {otrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="ui-card max-w-md w-full p-6 shadow-2xl text-center space-y-5"
            >
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 text-3xl mx-auto">
                🎉
              </div>
              
              <div className="space-y-2">
                <h3 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
                  Registration Successful!
                </h3>
                <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
                  Your unique **One Time Registration (OTR) Code** has been generated. You will need this code along with your phone number to login.
                </p>
              </div>

              {/* OTR DISPLAY BOX */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-between gap-4 border border-orange-100/50 dark:border-slate-800/40">
                <div className="flex-1 text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Your Login Code</span>
                  <p className="font-mono font-extrabold text-brand-primary dark:text-brand-secondary text-3xl tracking-widest">
                    {otrCode}
                  </p>
                </div>
                <button
                  onClick={handleCopyOTR}
                  className="ui-button-outline px-4 py-2.5 flex items-center gap-1.5 text-xs font-bold transition-all shrink-0"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  Copy Code
                </button>
              </div>

              <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30 rounded-xl p-3 text-xs text-orange-850 dark:text-orange-300 leading-relaxed">
                ⚠️ **CRITICAL**: Please write down or screenshot this code! You will not be able to retrieve it easily if lost.
              </div>

              <button
                onClick={handleModalClose}
                className="ui-button-primary w-full py-3"
              >
                Got it, Go to Login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
