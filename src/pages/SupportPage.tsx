import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle, Loader2 } from 'lucide-react';
import { useContactUsInfo, useContactUs } from '../hooks/useSettings';
import { useToast } from '../context/ToastContext';

export const SupportPage = () => {
  const { data: contactUsRes, isLoading } = useContactUsInfo();
  const contactMutation = useContactUs();
  const { showToast } = useToast();

  const hasContactData = contactUsRes?.data && (
    contactUsRes.data.phoneNumbers?.length > 0 ||
    contactUsRes.data.email ||
    contactUsRes.data.address ||
    contactUsRes.data.workingHours
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactData = contactUsRes?.data;
  const contactInfo = contactData ? {
    email: contactData.email || '',
    phoneNumbers: contactData.phoneNumbers || [],
    address: contactData.address || '',
    hours: contactData.workingHours || '',
  } : null;

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Invalid email address';
    }
    if (!formData.phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      tempErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    if (!formData.subject.trim()) tempErrors.subject = 'Subject is required';
    if (!formData.message.trim()) tempErrors.message = 'Message is required';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    contactMutation.mutate(formData, {
      onSuccess: () => {
        showToast('Message sent successfully! Our team will reach out soon.', 'success');
        setFormData({ name: '', email: '', phoneNumber: '', subject: '', message: '' });
        setErrors({});
      },
      onError: () => {
        showToast('Failed to send message. Please try again later.', 'error');
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header section */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Support Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Have any doubts, questions, or issues? Reach out to us through any of the channels below or send us a message — we typically respond within 24 hours.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading contact details...</p>
        </div>
      )}

      {/* No Contact Data State */}
      {!isLoading && !hasContactData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-20 space-y-4"
        >
          <div className="p-4 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-2xl">
            <Mail size={40} className="text-brand-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Contact Details Coming Soon
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              We are currently setting up our contact details. Please wait — you can check back in some time.
            </p>
          </div>
        </motion.div>
      )}

      {/* Contact Data Loaded */}
      {!isLoading && hasContactData && contactInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Contact Information Cards */}
          <div className="lg:col-span-1 space-y-2">
            {/* Section Header */}
            <div className="pb-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Contact Information
              </h2>
            </div>

            {/* Card 1: Email */}
            {contactInfo.email && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
                      <Mail size={20} />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Email
                      </span>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Write to Us</h3>
                      <a 
                        href={`mailto:${contactInfo.email}`}
                        className="block text-sm font-semibold text-brand-primary hover:underline break-all"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-500/20">
                    24h reply
                  </span>
                </div>
              </motion.div>
            )}

            {/* Card 2: Phone */}
            {contactInfo.phoneNumbers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="relative p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
                      <Phone size={20} />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Phone
                      </span>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Call Us</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {contactInfo.hours || 'Mon-Sat, 9:00 AM - 6:00 PM'}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-200/50 dark:border-blue-500/20">
                    Fast
                  </span>
                </div>
                <div className="mt-3 ml-[46px] space-y-2">
                  {contactInfo.phoneNumbers.map((p: { number: string; label: string }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        <a 
                          href={`tel:${p.number}`}
                          className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-brand-primary transition-colors"
                        >
                          {p.number}
                        </a>
                        {p.label && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary dark:text-brand-secondary bg-brand-primary/10 dark:bg-brand-primary/20 px-2 py-0.5 rounded-md">
                            {p.label}
                          </span>
                        )}
                      </div>
                      <a
                        href={`tel:${p.number}`}
                        className="text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors"
                      >
                        Call
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Card 3: Address */}
            {contactInfo.address && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="relative p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Location
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Visit Us</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
                      {contactInfo.address}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Card 4: Operating Hours */}
            {contactInfo.hours && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="relative p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
                    <Clock size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Hours
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Working Hours</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-350">
                      {contactInfo.hours}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Side: Message Submission Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Header */}
            <div className="pb-1">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Send a Message
              </h2>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Submit a Support Request</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fill in the details below and our team will get back to you as soon as possible.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all ${
                        errors.name 
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                      }`}
                    />
                    {errors.name && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.name}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className={`w-full px-4 py-3 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all ${
                        errors.email 
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                      }`}
                    />
                    {errors.email && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter 10-digit number"
                      className={`w-full px-4 py-3 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all ${
                        errors.phoneNumber 
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                      }`}
                    />
                    {errors.phoneNumber && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.phoneNumber}
                      </span>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      className={`w-full px-4 py-3 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all ${
                        errors.subject 
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                          : 'border-slate-200 dark:border-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                      }`}
                    />
                    {errors.subject && (
                      <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle size={10} /> {errors.subject}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Message Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your query or issue in detail..."
                    rows={5}
                    className={`w-full px-4 py-3 text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all ${
                      errors.message 
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary'
                    }`}
                  />
                  {errors.message && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.message}
                    </span>
                  )}
                </div>

                {/* Required fields note */}
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Fields marked with <span className="text-rose-500">*</span> are required.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={contactMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-brand-primary/10 active:scale-[0.99] disabled:opacity-75"
                >
                  {contactMutation.isPending ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Submit Support Request
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      )}

      {/* Map Embed Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4"
      >
        <div className="space-y-1">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Find Us
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Visit our office or locate us on Google Maps</p>
        </div>
        <div className="w-full h-[350px] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3718.9378723872605!2d72.8687078753715!3d21.234312080466818!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x23edd1e9a5188c01%3A0xf02c11f43f5a7caa!2sHK%20DigiVerse%20LLP!5e0!3m2!1sen!2sin!4v1769517970618!5m2!1sen!2sin"
            className="w-full h-full border-0"
            allowFullScreen={true}
            loading="lazy"
          />
        </div>
      </motion.div>
    </div>
  );
};
