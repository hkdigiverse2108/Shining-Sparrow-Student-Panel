import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BellRing, Bell, Calendar, ChevronRight, Trash2, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, useMarkReadMutation, useDeleteNotificationMutation } from '../hooks/useNotifications';
import type { NotificationItem } from '../services/notification.service';

const formatTimeAgo = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

export const Header = () => {
  const location = useLocation();
  const { student } = useAuth();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const { data: notificationData } = useNotifications();
  const markReadMutation = useMarkReadMutation();
  const deleteNotificationMutation = useDeleteNotificationMutation();

  const notifications = (notificationData?.data?.notification_data || []) as NotificationItem[];
  const unreadCount = notificationData?.data?.unreadCount || 0;

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const bellButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markReadMutation.mutate('all');
  };

  const handleClearAll = () => {
    deleteNotificationMutation.mutate('all');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(id);
  };

  if (!student) return null;

  // Generate dynamic breadcrumbs based on pathname and search query
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const search = location.search;

    if (path.startsWith('/dashboard')) {
      if (search.includes('tab=buy-courses')) {
        return { parent: 'Catalog', parentPath: '/dashboard?tab=buy-courses', child: 'Explore Courses' };
      }
      if (search.includes('tab=workshops')) {
        return { parent: 'Catalog', parentPath: '/dashboard?tab=workshops', child: 'Live Workshops' };
      }
      if (search.includes('tab=blogs')) {
        return { parent: 'Announcements', parentPath: '/dashboard?tab=blogs', child: 'Blogs & Updates' };
      }
      return { parent: 'Classroom', parentPath: '/dashboard?tab=classroom', child: 'Student Dashboard' };
    }

    if (path.startsWith('/profile')) {
      return { parent: 'Account', parentPath: '/profile', child: 'My Profile' };
    }

    if (path.startsWith('/courses/')) {
      const isWorkshop = search.includes('type=workshop');
      const fromClassroom = search.includes('from=classroom');
      return { 
        parent: fromClassroom ? 'Classroom' : (isWorkshop ? 'Workshops Catalog' : 'Courses Catalog'), 
        parentPath: fromClassroom ? '/dashboard?tab=classroom' : (isWorkshop ? '/dashboard?tab=workshops' : '/dashboard?tab=buy-courses'), 
        child: isWorkshop ? 'Workshop Details' : 'Course Details' 
      };
    }

    if (path.startsWith('/lms/')) {
      const courseId = path.split('/')[2]?.split('?')[0];
      return { parent: 'Course Details', parentPath: `/courses/${courseId}?from=classroom`, child: 'LMS Study Center' };
    }

    if (path.startsWith('/workshop-lms/')) {
      const workshopId = path.split('/')[2]?.split('?')[0];
      return { parent: 'Workshop Details', parentPath: `/courses/${workshopId}?type=workshop&from=classroom`, child: 'Workshop Streaming' };
    }

    return { parent: 'Classroom', parentPath: '/dashboard', child: 'Panel Home' };
  };

  const { parent, parentPath, child } = getBreadcrumbs();

  // Get current date string formatted nicely
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between border-b border-orange-100/50 dark:border-slate-800/60 bg-white/70 dark:bg-page-dark/70 backdrop-blur-md sticky top-0 z-20 transition-all duration-200">
      
      {/* Left Side: Breadcrumb details */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Link to={parentPath} className="hover:text-brand-primary transition-colors cursor-pointer">
          {parent}
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 dark:text-slate-200 font-extrabold">{child}</span>
      </div>

      {/* Right Side: Date, search box mockup, and notifications */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Date banner */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-405">
          <Calendar size={14} className="text-brand-primary" />
          <span>{getFormattedDate()}</span>
        </div>

        {/* Notifications Icon (Matches the glowing notification look of reference UI) */}
        <div className="relative">
          <button 
            ref={bellButtonRef}
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
              isOpen 
                ? 'border-brand-primary bg-orange-55/60 dark:bg-orange-950/20 text-brand-primary' 
                : 'border-orange-100/40 dark:border-slate-800 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 text-slate-505 hover:text-brand-primary'
            }`}
          >
            {unreadCount > 0 ? (
              <BellRing size={16} className="animate-pulse text-brand-primary" />
            ) : (
              <Bell size={16} />
            )}
          </button>
          
          {/* Glowing Red Dot */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900 shadow-[0_0_8px_rgba(244,63,94,0.8)] pointer-events-none" />
          )}

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/80 rounded-3xl shadow-[0_15px_50px_rgba(232,100,36,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-orange-100/40 dark:border-slate-800/60 bg-orange-50/20 dark:bg-slate-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white">Sparrow Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-secondary rounded-full text-[10px] font-black">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Mark all as read"
                      >
                        <CheckCheck size={12} />
                        Read All
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Clear all notifications"
                      >
                        <Trash2 size={12} />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                {/* Notifications List */}
                <div className="max-h-90 overflow-y-auto divide-y divide-orange-100/20 dark:divide-slate-800/30">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-10 flex flex-col items-center text-center space-y-3">
                      <div className="relative">
                        <span className="text-4xl block animate-bounce">🐦</span>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-card-dark" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800 dark:text-white">All caught up!</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 max-w-50 leading-relaxed">
                          Sparky will sing and alert you when there is something new!
                        </p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      let typeEmoji = '🔔';
                      let badgeColorClass = 'bg-orange-50 dark:bg-orange-950/20 border-orange-100/50 dark:border-orange-950/30';
                      if (n.type === 'achievement') {
                        typeEmoji = '🏆';
                        badgeColorClass = 'bg-amber-50 dark:bg-amber-950/20 border-amber-100/50 dark:border-amber-950/30';
                      } else if (n.type === 'workshop') {
                        typeEmoji = '🚀';
                        badgeColorClass = 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-950/30';
                      } else if (n.type === 'news') {
                        typeEmoji = '📰';
                        badgeColorClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-950/30';
                      }

                      return (
                        <div
                          key={n._id}
                          onClick={() => handleToggleRead(n._id)}
                          className={`px-5 py-3.5 flex items-start gap-3.5 hover:bg-orange-50/10 dark:hover:bg-slate-800/20 cursor-pointer transition-colors duration-200 relative group/item ${
                            !n.isRead ? 'bg-orange-50/10 dark:bg-slate-800/10' : ''
                          }`}
                        >
                          {/* Left icon wrapper */}
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base shrink-0 ${badgeColorClass}`}>
                            {typeEmoji}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className={`text-xs leading-tight line-clamp-1 ${!n.isRead ? 'font-black text-slate-800 dark:text-white' : 'font-semibold text-slate-500 dark:text-slate-400'}`}>
                                {n.title}
                              </h5>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 font-medium whitespace-nowrap mt-0.5">
                                {formatTimeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className={`text-[10px] leading-relaxed line-clamp-2 ${!n.isRead ? 'text-slate-600 dark:text-slate-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                              {n.message}
                            </p>
                          </div>

                          {/* Action indicator & Delete button container */}
                          <div className="flex items-center gap-1.5 self-center shrink-0">
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full group-hover/item:hidden animate-pulse" />
                            )}
                            <button
                              onClick={(e) => handleDelete(n._id, e)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer"
                              title="Delete notification"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Short Profile Initials Avatar */}
        <Link to="/profile" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-secondary border border-brand-primary/20 flex items-center justify-center text-xs font-black uppercase">
            {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </Link>
      </div>

    </header>
  );
};
