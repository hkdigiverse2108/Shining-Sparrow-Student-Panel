import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle } from 'lucide-react';
import { useSettings, useContactUs } from '../hooks/useSettings';
import { useToast } from '../context/ToastContext';

export const SupportPage = () => {
  const { data: settingsRes } = useSettings();
  const contactMutation = useContactUs();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fallback defaults in case backend settings are not loaded yet
  const defaultContact = {
    email: 'info@shiningsparrow.com',
    phone: '+91 90999 77890',
    address: 'HK DigiVerse LLP, Surat, Gujarat, India',
    hours: 'Monday - Saturday: 09:00 AM - 06:00 PM'
  };

  const contactInfo = settingsRes?.data ? {
    email: settingsRes.data.emailSales || defaultContact.email,
    phone: settingsRes.data.contactNumber || defaultContact.phone,
    address: settingsRes.data.address || defaultContact.address,
    hours: defaultContact.hours
  } : defaultContact;

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
          Have any doubts, questions, or issues? Reach out to us directly through any of our channels or drop us a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Contact Information Cards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card 1: Email */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
              <Mail size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Email Support</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Expect a reply within 24 hours</p>
              <a 
                href={`mailto:${contactInfo.email}`}
                className="block text-sm font-semibold text-brand-primary hover:underline break-all pt-1"
              >
                {contactInfo.email}
              </a>
            </div>
          </motion.div>

          {/* Card 2: Phone */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
              <Phone size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Call Support</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Mon-Sat, 9:00 AM - 6:00 PM</p>
              <a 
                href={`tel:${contactInfo.phone}`}
                className="block text-sm font-semibold text-brand-primary hover:underline pt-1"
              >
                {contactInfo.phone}
              </a>
            </div>
          </motion.div>

          {/* Card 3: Address */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
              <MapPin size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Office Location</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Corporate Headquarters</p>
              <p className="text-sm text-slate-600 dark:text-slate-350 pt-1 leading-relaxed">
                {contactInfo.address}
              </p>
            </div>
          </motion.div>

          {/* Card 4: Operating Hours */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
          >
            <div className="p-3 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-xl shrink-0">
              <Clock size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Working Hours</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Support Availability</p>
              <p className="text-sm text-slate-600 dark:text-slate-350 pt-1">
                {contactInfo.hours}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Message Submission Form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Send us a Message</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fill in the form details below to submit a ticket/request directly to our administration.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Your Name
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
                    Email Address
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
                    Phone Number
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
                    Subject
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
                  Message Details
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

      {/* Map Embed Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-4"
      >
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-150">Locate Us</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Visit our office locations or scan/pin us on Google Maps</p>
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
