import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { Mail, Phone, User, Landmark, School, Send, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import { CelebrationModal } from '../components/CelebrationModal';

const GUJARAT_DISTRICTS = [
  "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", 
  "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhumi Dwarka", 
  "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", 
  "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", 
  "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", 
  "Tapi", "Vadodara", "Valsad"
];

const REACH_SOURCES = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'Friends/relatives',
  'Webinars',
  'Offline branch visit',
  'Web search',
  'Schools',
  'Others',
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
  '11th Std',
  '12th Std',
  'Adult Learner','Adult Learner',
];

interface SearchableDropdownProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  icon: React.ReactNode;
  required?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select option",
  icon,
  required = false
}) => {
  const [show, setShow] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filtered = (search && !options.includes(search))
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (show && listRef.current) {
      const activeEl = listRef.current.children[activeIdx] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [activeIdx, show]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShow(false);
        setSearch(value);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show) {
      if (e.key === 'ArrowDown') {
        setShow(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      if (filtered.length > 0 && activeIdx >= 0 && activeIdx < filtered.length) {
        e.preventDefault();
        onChange(filtered[activeIdx]);
        setShow(false);
      }
    } else if (e.key === 'Escape') {
      setShow(false);
      setSearch(value);
    }
  };

  return (
    <div ref={containerRef} className="space-y-1.5 relative w-full">
      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        <input
          type="text"
          required={required}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShow(true);
            setActiveIdx(0);
          }}
          onFocus={() => setShow(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="ui-input pl-11 pr-10 font-semibold cursor-pointer w-full"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 p-1 focus:outline-none"
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${show ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence>
        {show && filtered.length > 0 && (
          <motion.ul
            ref={listRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-200/10 dark:shadow-black/40 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 p-1 m-0 list-none scrollbar-thin"
          >
            {filtered.map((d, index) => {
              const isSelected = d === value;
              const isActive = index === activeIdx;
              return (
                <li
                  key={d}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(d);
                    setShow(false);
                  }}
                  onMouseEnter={() => setActiveIdx(index)}
                  className={`px-4 py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer rounded-lg flex items-center justify-between
                    ${isActive 
                      ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 pl-5' 
                      : isSelected
                        ? 'bg-orange-50/50 dark:bg-orange-950/20 text-orange-600/80 dark:text-orange-400/80'
                        : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                    {d}
                  </span>
                  {isSelected && <span className="text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-450 px-1.5 py-0.5 rounded-md">Selected</span>}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SignupPage = () => {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('Surat');
  const [std, setStd] = useState('5th Std');
  const [reachFrom, setReachFrom] = useState('Instagram');
  const [schoolName, setSchoolName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [otrCode, setOtrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pendingOTR, setPendingOTR] = useState<string | null>(null);

  // District list state
  const [districtsList, setDistrictsList] = useState<string[]>(GUJARAT_DISTRICTS);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.states) {
          const allDistricts = data.states.flatMap((s: any) => s.districts);
          const uniqueDistricts = Array.from(new Set(allDistricts)).sort() as string[];
          setDistrictsList(uniqueDistricts);
        }
      })
      .catch(err => console.error("Error fetching districts:", err));
  }, []);

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
        schoolName,
        agreeTerms,
      });

      if (response && response.status === 200) {
        const hasWelcomed = localStorage.getItem('shining_sparrow_welcomed');
        if (!hasWelcomed) {
          setPendingOTR(response.data.otr);
          setShowWelcome(true);
        } else {
          setOtrCode(response.data.otr);
        }
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

  const handleWelcomeClose = () => {
    localStorage.setItem('shining_sparrow_welcomed', 'true');
    setShowWelcome(false);
    if (pendingOTR) {
      setOtrCode(pendingOTR);
      setPendingOTR(null);
    }
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
                  onChange={(e) => setEmail(e.target.value.slice(0, 35))}
                  maxLength={35}
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
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  placeholder="9876543210"
                  className="ui-input pl-11 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Std & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SearchableDropdown
              label="Standard (Std)"
              value={std}
              onChange={setStd}
              options={STANDARD_OPTIONS}
              icon={<School size={16} />}
              required
            />

            <SearchableDropdown
              label="District"
              value={district}
              onChange={setDistrict}
              options={districtsList}
              icon={<Landmark size={16} />}
              placeholder="Select or type district"
              required
            />
          </div>

          {/* School Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
              School Name
              <span className="ml-1.5 text-[9px] font-semibold normal-case tracking-normal text-slate-400 dark:text-slate-600">(optional)</span>
            </label>
            <div className="relative">
              <School className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter your school name"
                className="ui-input pl-11 font-semibold"
              />
            </div>
          </div>

          {/* Reach Source */}
          <SearchableDropdown
            label="How did you hear about us?"
            value={reachFrom}
            onChange={setReachFrom}
            options={REACH_SOURCES}
            icon={<Send size={16} />}
            required
          />

          {/* Agree Terms */}
          <div className="flex items-start gap-2 pt-2">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary border-slate-400 dark:border-slate-700 rounded transition-colors"
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
        <div className="text-center text-xs text-slate-500 mt-4!">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>

      {/* WELCOME CELEBRATION MODAL */}
      <CelebrationModal
        isOpen={showWelcome}
        onClose={handleWelcomeClose}
        title="Welcome to Shining Sparrow!"
        subtitle="You've joined thousands of learners. Let's begin your journey!"
        buttonText="Continue"
        showConfetti={true}
      />

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
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
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
