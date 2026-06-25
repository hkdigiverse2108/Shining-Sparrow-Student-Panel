import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, User, Menu, X, Copy, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';

export const Navbar = () => {
  const { student, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleCopyOTR = (otr: string) => {
    navigator.clipboard.writeText(otr);
    setCopied(true);
    showToast('OTR Code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full transition-all duration-200 glass border-b border-orange-200/40 dark:border-orange-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Shining-Sparrow"
                className="h-10 sm:h-12 object-contain"
              />
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center ml-10 space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive('/') 
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' 
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                }`}
              >
                Home
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive('/dashboard') 
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' 
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                  }`}
                >
                  My Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right Header Options */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated && student ? (
              <div className="relative">
                {/* Profile Trigger */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-orange-200/40 dark:hover:border-slate-700"
                >
                  <img
                    src={student.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${student.fullName}`}
                    alt="profile"
                    className="w-8 h-8 rounded-full border border-orange-100 dark:border-orange-950 object-cover"
                  />
                  <span className="text-sm font-bold max-w-25 truncate text-slate-700 dark:text-slate-200">
                    {student.fullName.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)] border bg-white dark:bg-slate-800 border-orange-100 dark:border-slate-750 p-2 z-20"
                      >
                        {/* Student OTR Panel */}
                        <div className="px-4 py-3 border-b border-orange-50 dark:border-slate-700 flex flex-col gap-1 bg-orange-50/30 dark:bg-orange-950/10 rounded-xl mb-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">One-Time Registration Code</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400 text-lg tracking-widest">
                              {student.otr}
                            </span>
                            <button
                              onClick={() => handleCopyOTR(student.otr)}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-500"
                            >
                              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Dropdown Links */}
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <User size={16} />
                          My Profile
                        </Link>

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setIsLogoutModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-200/50 dark:shadow-none hover:shadow-lg transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-orange-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-6 space-y-3"
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-base font-semibold ${
                isActive('/') 
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' 
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
              }`}
            >
              Home
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-semibold ${
                  isActive('/dashboard') 
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400' 
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                }`}
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated && student ? (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="px-4 py-2 bg-orange-50/50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Your OTR</span>
                    <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400 tracking-wider text-base">{student.otr}</span>
                  </div>
                  <button
                    onClick={() => handleCopyOTR(student.otr)}
                    className="p-1.5 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  My Profile
                </Link>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full text-left block px-4 py-2.5 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-base font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-base font-semibold text-white bg-orange-600 hover:bg-orange-500 shadow-md"
                >
                  Signup
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </nav>
  );
};
