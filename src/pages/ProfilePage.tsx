import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMyCourses } from '../hooks/useCourses';
import { useMyWorkshops } from '../hooks/useWorkshops';
import { useToast } from '../context/ToastContext';
import { useSubmitTestimonial } from '../hooks/useSettings';
import { User, Phone, Landmark, School, Save, Copy, Check, Mail, MapPin, BookOpen, Award, ImagePlus, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';
import client from '../api/client';
import { getImageUrl } from '../utils/fallbacks';

const cardContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

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
  'Adult Learner',
];

export const ProfilePage = () => {
  const { student, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Enrollment stats
  const { data: myCoursesRes } = useMyCourses({ page: 1, limit: 100 });
  const { data: myWorkshopsRes } = useMyWorkshops({ page: 1, limit: 100 });
  const enrolledCoursesCount = (myCoursesRes?.data?.purchased_course_data || []).length;
  const enrolledWorkshopsCount = (myWorkshopsRes?.data?.purchased_workshop_data || []).length;

  // Profile Form States
  const [fullName, setFullName] = useState(student?.fullName || '');
  const phoneNumber = student?.phoneNumber || '';
  const [district, setDistrict] = useState(student?.district || '');
  const [std, setStd] = useState(student?.std || '5th Std');
  const [schoolName, setSchoolName] = useState(student?.schoolName || '');
  const [profilePhoto, setProfilePhoto] = useState(student?.profilePhoto || '');
  const [address, setAddress] = useState(student?.address || '');
  const [reachFrom, setReachFrom] = useState(student?.reachFrom || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Global feedback/testimonial states
  const [generalRating, setGeneralRating] = useState(5);
  const [generalReviewText, setGeneralReviewText] = useState('');
  const [generalFeedbackSuccess, setGeneralFeedbackSuccess] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const submitTestimonialMutation = useSubmitTestimonial();

  const handleGeneralFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalReviewText.trim()) {
      showToast('Please enter your review.', 'error');
      return;
    }
    setSubmittingFeedback(true);
    submitTestimonialMutation.mutate(
      {
        name: student?.fullName || 'Student',
        description: generalReviewText,
        rate: generalRating,
        type: 'home',
        learningCatalogId: undefined as any,
      },
      {
        onSuccess: () => {
          showToast('Thank you for your feedback! 🌟', 'success');
          setGeneralReviewText('');
          setGeneralFeedbackSuccess(true);
          setSubmittingFeedback(false);
        },
        onError: () => {
          showToast('Failed to submit feedback. Please try again.', 'error');
          setSubmittingFeedback(false);
        }
      }
    );
  };

  // Autocomplete state
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const handleDistrictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDistrict(val);
    if (val.trim().length > 1) {
      const filtered = districtsList.filter(d => 
        d.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 10);
      setFilteredDistricts(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectDistrict = (d: string) => {
    setDistrict(d);
    setShowSuggestions(false);
  };

  // OTR Copy State
  const [copied, setCopied] = useState(false);

  const handleCopyOTR = () => {
    if (student?.otr) {
      navigator.clipboard.writeText(student.otr);
      setCopied(true);
      showToast('OTR Code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const response = await updateProfile({
        fullName,
        phone: phoneNumber,
        designation: student?.designation || 'Student',
        profilePhoto,
        district,
        std,
        schoolName,
        address,
        reachFrom,
      });

      if (response && response.status === 200) {
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(response.message || 'Failed to update profile.', 'error');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Error updating profile details.';
      showToast(errMsg, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const avatarSrc = getImageUrl(profilePhoto) || `https://api.dicebear.com/7.x/bottts/svg?seed=${student?.otr}`;

  return (
    <div className="w-full min-h-screen">

      {/* ═══════════════ PROFILE CARD ═══════════════ */}
      <motion.div variants={pageChildVariants} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="ui-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative shrink-0"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
                  <img
                    src={avatarSrc}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-card-dark" />
              </motion.div>

              {/* Name & Meta */}
              <div className="flex-1 text-center sm:text-left space-y-1 pb-1">
                <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                  {student?.fullName || 'Student'}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {student?.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-brand-primary" />
                      {student.email}
                    </span>
                  )}
                  {student?.std && (
                    <span className="flex items-center gap-1">
                      <School size={12} className="text-brand-primary" />
                      {student.std}
                    </span>
                  )}
                  {student?.schoolName && (
                    <span className="flex items-center gap-1">
                      <School size={12} className="text-brand-primary" />
                      {student.schoolName}
                    </span>
                  )}
                  {student?.district && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-brand-primary" />
                      {student.district}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 sm:gap-6 shrink-0">
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900 dark:text-white">{enrolledCoursesCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Courses</span>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <span className="block text-2xl font-black text-slate-900 dark:text-white">{enrolledWorkshopsCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workshops</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <motion.div variants={pageChildVariants} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ─── Account Info Cards ─── */}
        <motion.div
          variants={cardContainerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          
          {/* OTR Card */}
          <motion.div
            variants={cardItemVariants}
            className="ui-card ui-card-hover space-y-3 relative overflow-hidden group"
          >
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Your OTR
              </span>
              <button
                onClick={handleCopyOTR}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                title="Copy OTR"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
            <span className="font-mono font-black text-xl text-brand-primary dark:text-brand-secondary tracking-[0.2em] block relative z-10">
              {student?.otr || '—'}
            </span>
            <p className="text-[10px] text-slate-400 leading-relaxed relative z-10">
              Use this code to login from any device. Keep it safe!
            </p>
          </motion.div>

          {/* Email Card */}
          <motion.div
            variants={cardItemVariants}
            className="ui-card ui-card-hover space-y-3"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Email Address
            </span>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Mail size={16} className="text-blue-500" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {student?.email || '—'}
              </span>
            </div>
          </motion.div>

          {/* Member Since Card */}
          <motion.div
            variants={cardItemVariants}
            className="ui-card ui-card-hover space-y-3"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Learning Stats
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <BookOpen size={16} className="text-emerald-500" />
                </div>
                <div>
                  <span className="block text-lg font-black text-slate-900 dark:text-white">{enrolledCoursesCount + enrolledWorkshopsCount}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Total Programs</span>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <Award size={16} className="text-amber-500" />
                </div>
                <div>
                  <span className="block text-lg font-black text-slate-900 dark:text-white">{student?.std || '—'}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Standard</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Edit Profile Form ─── */}
        <motion.div
          variants={pageChildVariants}
          className="ui-card shadow-sm overflow-hidden"
        >
          {/* Form Header */}
          <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                <User size={18} className="text-brand-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Edit Profile
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Update your personal information below
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleProfileSubmit} className="px-6 sm:px-8 py-6 sm:py-8 space-y-6">
            
            {/* Row 1: Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="ui-input pl-11"
                />
              </div>
            </div>

            {/* Row 2: Phone + Email (read-only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Phone Number
                  <span className="ml-1.5 text-[9px] font-semibold normal-case tracking-normal text-slate-400 dark:text-slate-600">(read-only)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={16} />
                  <input
                    type="tel"
                    readOnly
                    value={phoneNumber}
                    placeholder="+91 12345 67890"
                    className="ui-input pl-11 bg-slate-100/50 dark:bg-slate-950/50 text-slate-405 dark:text-slate-500 cursor-not-allowed border-dashed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Email Address
                  <span className="ml-1.5 text-[9px] font-semibold normal-case tracking-normal text-slate-400 dark:text-slate-600">(read-only)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={16} />
                  <input
                    type="email"
                    readOnly
                    value={student?.email || ''}
                    className="ui-input pl-11 bg-slate-100/50 dark:bg-slate-950/50 text-slate-405 dark:text-slate-500 cursor-not-allowed border-dashed"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Standard + District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Standard (Std)
                </label>
                <div className="relative">
                  <School className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={std}
                    onChange={(e) => setStd(e.target.value)}
                    className="ui-input pl-11 appearance-none cursor-pointer"
                  >
                    {STANDARD_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  District
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={handleDistrictChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="e.g. Ahmedabad"
                    className="ui-input pl-11"
                  />
                </div>
                {showSuggestions && filteredDistricts.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 p-0 m-0 list-none">
                    {filteredDistricts.map((d) => (
                      <li
                        key={d}
                        onClick={() => handleSelectDistrict(d)}
                        className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Row: School Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                  className="ui-input pl-11"
                />
              </div>
            </div>

            {/* Row: Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Address
                <span className="ml-1.5 text-[9px] font-semibold normal-case tracking-normal text-slate-400 dark:text-slate-600">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-5 -translate-y-1/2 text-slate-400" size={16} />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete address"
                  className="ui-input pl-11 py-3 min-h-[80px]"
                />
              </div>
            </div>

            {/* Row: Referral Source (reachFrom) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Referral Source (How did you hear about us?)
                <span className="ml-1.5 text-[9px] font-semibold normal-case tracking-normal text-slate-400 dark:text-slate-600">(optional)</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={reachFrom}
                  onChange={(e) => setReachFrom(e.target.value)}
                  className="ui-input pl-11 appearance-none cursor-pointer"
                >
                  <option value="">Select source</option>
                  {REACH_SOURCES.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Profile Photo Upload / URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Profile Photo
                <span className="ml-1.5 text-[9px] font-semibold normal-case tracking-normal text-slate-400 dark:text-slate-600">(Upload file or paste link)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative grow">
                  <ImagePlus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="ui-input pl-11"
                  />
                </div>
                <div className="shrink-0 flex items-center">
                  <input
                    type="file"
                    id="profile-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const formData = new FormData();
                      formData.append('category', 'user');
                      formData.append('images', file);
                      
                      setUploadLoading(true);
                      try {
                        const response = await client.post('/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        
                        if (response.data?.data?.images?.[0]) {
                          setProfilePhoto(response.data.data.images[0]);
                          showToast('Photo uploaded successfully! Save changes to apply.', 'success');
                        } else {
                          showToast('Upload failed. No URL returned.', 'error');
                        }
                      } catch (err) {
                        console.error(err);
                        showToast('Error uploading photo.', 'error');
                      } finally {
                        setUploadLoading(false);
                      }
                    }}
                  />
                  <label
                    htmlFor="profile-upload"
                    className={`px-5 h-11 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border-dashed w-full sm:w-auto ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload Image File'}
                  </label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center gap-4">
              <button
                type="submit"
                disabled={profileLoading}
                className="ui-button-primary px-8 py-3.5 text-sm gap-2"
              >
                <Save size={16} />
                {profileLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <span className="text-[11px] text-slate-450 dark:text-slate-500 font-medium hidden sm:block">
                Changes are saved instantly to your account
              </span>
            </div>
          </form>
        </motion.div>

        {/* ═══════════════ GLOBAL FEEDBACK/TESTIMONIAL ═══════════════ */}
        <div className="ui-card p-6 sm:p-8 mt-8">
          <div className="border-b dark:border-slate-800 pb-3">
            <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white">
              Share Your Overall Feedback
            </h3>
            <p className="text-[11px] text-slate-400">
              We would love to know about your overall experience with our teachings and platform! Your review may be featured on our homepage.
            </p>
          </div>

          {generalFeedbackSuccess ? (
            <div className="p-4 mt-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/40 rounded-2xl text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              🎉 Thank you for sharing your feedback with us!
            </div>
          ) : (
            <form onSubmit={handleGeneralFeedbackSubmit} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5 h-11">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setGeneralRating(star)}
                        className="text-xl transition-all hover:scale-120 cursor-pointer"
                      >
                        {star <= generalRating ? (
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
                  Your Review
                </label>
                <textarea
                  value={generalReviewText}
                  onChange={(e) => setGeneralReviewText(e.target.value)}
                  placeholder="Tell us what you think about our platform..."
                  className="ui-input py-3 min-h-[100px]"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="ui-button-primary px-8 py-3.5 text-sm gap-2"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>

      </motion.div>
    </div>
  );
};
