import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useBlogs } from '../hooks/useBlogs';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';
import { 
  BookOpen, ShoppingBag, Tv, Newspaper, User, LogOut, Sun, Moon, 
  Menu, X, Copy, Check, ChevronRight, ChevronLeft, MessageSquare,
  CreditCard, HelpCircle, Image
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { handleImageError, getAvatarFallback } from '../utils/fallbacks';

import { useChatContext } from '../context/ChatContext';

export const Sidebar = () => {
  const { student, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadRooms } = useChatContext();

  const [copied, setCopied] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Fetch actual blog blogCount
  const { data: blogsRes } = useBlogs({ page: 1, limit: 1 });
  const blogCount = blogsRes?.data?.totalData || blogsRes?.data?.blog_data?.length || 0;
  
  // Collapse state for desktop view
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!isAuthenticated || !student) return null;

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const handleCopyOTR = (otr: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(otr);
    setCopied(true);
    showToast('OTR Code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  // Determine active state by matching pathname and search query params
  const isActive = (path: string, searchParam = '') => {
    if (searchParam) {
      return location.pathname === path && location.search.includes(searchParam);
    }
    // Default classroom tab matches /dashboard with empty search or tab=classroom
    if (path === '/dashboard' && !searchParam) {
      return location.pathname === '/dashboard' && 
             (!location.search || location.search.includes('tab=classroom'));
    }
    return location.pathname === path && !location.search;
  };

  const menuItems = [
    {
      label: 'Classroom',
      icon: BookOpen,
      path: '/dashboard',
      search: '',
    },
    {
      label: 'Buy Courses',
      icon: ShoppingBag,
      path: '/dashboard',
      search: 'tab=buy-courses',
    },
    {
      label: 'Workshops',
      icon: Tv,
      path: '/dashboard',
      search: 'tab=workshops',
    },
    {
      label: 'Chat',
      icon: MessageSquare,
      path: '/chat',
      search: '',
      badge: unreadRooms.length > 0 ? String(unreadRooms.length) : undefined,
    },
    {
      label: 'Blogs & Updates',
      icon: Newspaper,
      path: '/dashboard',
      search: 'tab=blogs',
      badge: blogCount > 0 ? String(blogCount) : undefined,
    },
    {
      label: 'Payment History',
      icon: CreditCard,
      path: '/payments/history',
      search: '',
    },
    {
      label: 'My Profile',
      icon: User,
      path: '/profile',
      search: '',
    },
    {
      label: 'Events Gallery',
      icon: Image,
      path: '/gallery',
      search: '',
    },
    {
      label: 'Support Center',
      icon: HelpCircle,
      path: '/support',
      search: '',
    },
  ];



  const renderSidebarContent = (collapsed = false) => (
    <div className={`flex flex-col h-full justify-between transition-all duration-300 ${collapsed ? 'px-3 py-6' : 'p-6'}`}>
      {/* Top Section: Brand & Navigation */}
      <div className="space-y-8">
        {/* Brand/Logo Header */}
        <div className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center' : 'px-2'}`}>
          {collapsed ? (
            <img
              src="/mascot.png"
              alt="Shining-Sparrow"
              className="h-10 w-25 object-contain drop-shadow-sm"
            />
          ) : (
            <img
              src="/logo.png"
              alt="Shining-Sparrow" 
              className="h-10 sm:h-20 w-auto object-contain drop-shadow-sm"
            />
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path, item.search);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.label}
                to={item.search ? `${item.path}?${item.search}` : item.path}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center transition-all duration-200 group ${
                  collapsed 
                    ? 'w-12 h-12 justify-center rounded-2xl mx-auto' 
                    : 'justify-between px-4 py-3 rounded-2xl text-sm font-bold'
                } ${
                  active
                    ? 'bg-brand-primary text-white shadow-[0_4px_20px_rgba(232,100,36,0.25)] dark:shadow-[0_0_20px_rgba(232,100,36,0.35)] dark:border dark:border-brand-primary/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 hover:text-brand-primary dark:hover:text-brand-secondary'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                  <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary transition-colors'} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                
                {/* Badge Count or Right arrow indicator */}
                {!collapsed ? (
                  item.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      active 
                        ? 'bg-white text-brand-primary' 
                        : 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-secondary animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  ) : (
                    !active && (
                      <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )
                  )
                ) : (
                  // Collapsed badge dot
                  item.badge && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-primary dark:bg-brand-secondary rounded-full border border-white dark:border-page-dark animate-pulse shadow-[0_0_8px_rgba(232,100,36,0.8)]" />
                  )
                )}

                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-slate-900/90 dark:bg-slate-950/95 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-800">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile card, theme toggler, log out */}
      <div className={`space-y-5 pt-6 border-t border-orange-100/60 dark:border-slate-800/40 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        
        {/* Student Mini Profile Info */}
        {collapsed ? (
          <div 
            onClick={(e) => handleCopyOTR(student.otr, e)}
            className="relative flex justify-center group cursor-pointer"
          >
            <img
              src={student.profilePhoto || getAvatarFallback(student.fullName)}
              alt={student.fullName}
              className="w-11 h-11 rounded-full border-2 border-orange-200 dark:border-orange-900 object-cover shadow-sm hover:scale-105 transition-transform"
              onError={(e) => handleImageError(e, getAvatarFallback(student.fullName))}
            />
            {/* Rich Collapsed Tooltip with Copy Indicator */}
            <div className="absolute left-full bottom-0 ml-4 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/98 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl space-y-2.5 border border-slate-800">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2">
                <img
                  src={student.profilePhoto || getAvatarFallback(student.fullName)}
                  alt={student.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => handleImageError(e, getAvatarFallback(student.fullName))}
                />
                <div>
                  <p className="font-extrabold text-slate-100">{student.fullName}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{student.std}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 bg-slate-800 p-2 rounded-xl border border-slate-700">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">Your OTR</span>
                  <span className="font-mono font-extrabold text-brand-secondary text-xs tracking-wider mt-0.5">{student.otr}</span>
                </div>
                <div className="text-[9px] text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-md">
                  Click to copy
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-950/20 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-3">
              <img
                src={student.profilePhoto || getAvatarFallback(student.fullName)}
                alt={student.fullName}
                className="w-10 h-10 rounded-full border border-orange-200 dark:border-orange-900 object-cover"
                onError={(e) => handleImageError(e, getAvatarFallback(student.fullName))}
              />
              <div className="min-w-0">
                <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {student.fullName}
                </span>
                <span className="block text-[10px] text-slate-405 dark:text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                  {student.std}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-orange-100/30 dark:border-slate-800">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">Your OTR</span>
                <span className="font-mono font-extrabold text-brand-primary dark:text-brand-secondary text-sm tracking-widest mt-0.5">
                  {student.otr}
                </span>
              </div>
              <button
                onClick={(e) => handleCopyOTR(student.otr, e)}
                className="p-1.5 rounded-lg bg-orange-50 dark:bg-slate-800 border border-orange-100/40 dark:border-slate-700 hover:bg-orange-100/50 dark:hover:bg-slate-700 text-slate-500"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        )}

        {/* Action Toggles */}
        <div className={`flex flex-col ${collapsed ? 'items-center gap-2.5 w-full' : 'gap-1.5'}`}>
          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className={`relative flex items-center rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-colors group ${
              collapsed ? 'w-12 h-12 justify-center' : 'justify-between px-4 py-2.5 w-full'
            }`}
          >
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              {theme === 'dark' ? (
                <Sun size={16} className="text-amber-500" />
              ) : (
                <Moon size={16} className="text-slate-500" />
              )}
              {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </div>
            {!collapsed && <span className="text-[10px] text-slate-400 dark:text-slate-500">Theme toggle</span>}

            {collapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 rounded-lg bg-slate-900/90 dark:bg-slate-950/95 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </div>
            )}
          </button>

          {/* Log Out */}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className={`relative flex items-center rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors group ${
              collapsed ? 'w-12 h-12 justify-center' : 'gap-3 px-4 py-2.5 w-full text-left'
            }`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Log out</span>}

            {collapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 rounded-lg bg-slate-900/90 dark:bg-slate-950/95 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                Log out
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Left-positioned) */}
      <aside className={`hidden lg:block h-screen sticky top-0 bg-white dark:bg-page-dark border-r border-orange-100 dark:border-slate-800/40 shrink-0 z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}>
        {/* Sleek floating collapse/expand button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-9 w-6 h-6 bg-white dark:bg-page-dark border border-orange-100 dark:border-slate-800/80 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary shadow-md hover:shadow-lg z-50 transition-all hover:scale-110 cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
        
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* Mobile Top Navigation bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-16 bg-white dark:bg-page-dark border-b border-orange-100 dark:border-slate-800 w-full z-30 transition-colors duration-200">
        <Link to="/dashboard">
          <img
            src="/logo.png"
            alt="Shining-Sparrow"
            className="h-9 w-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-brand-primary"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer Slide-over */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Sidebar drawer content - always expanded */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-page-dark flex flex-col shadow-2xl z-10"
            >
              {/* Close Button inside drawer */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
              
              <div className="h-full pt-10">
                {renderSidebarContent(false)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};
