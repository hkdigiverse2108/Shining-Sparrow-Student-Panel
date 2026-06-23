import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMyCourses } from '../hooks/useCourses';
import { useMyWorkshops } from '../hooks/useWorkshops';
import { useToast } from '../context/ToastContext';
import { User, Phone, Landmark, School, Save, Copy, Check, Mail, MapPin, BookOpen, Award, ImagePlus, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

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
  const [phoneNumber, setPhoneNumber] = useState(student?.phoneNumber || '');
  const [district, setDistrict] = useState(student?.district || '');
  const [std, setStd] = useState(student?.std || '5th Std');
  const [schoolName, setSchoolName] = useState(student?.schoolName || '');
  const [profilePhoto, setProfilePhoto] = useState(student?.profilePhoto || '');
  const [profileLoading, setProfileLoading] = useState(false);

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

  const avatarSrc = profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${student?.otr}`;

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
                Login OTR Code
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
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 12345 67890"
                    className="ui-input pl-11"
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  District
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Ahmedabad"
                    className="ui-input pl-11"
                  />
                </div>
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

            {/* Row 4: Profile Photo URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Profile Photo URL
                <span className="ml-1.5 text-[9px] font-semibold normal-case tracking-normal text-slate-400 dark:text-slate-600">(optional)</span>
              </label>
              <div className="relative">
                <ImagePlus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="url"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="ui-input pl-11"
                />
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

      </motion.div>
    </div>
  );
};
