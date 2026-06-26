import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourse } from '../hooks/useCourses';
import { useExamForLesson, useCompleteLesson, useExamAttempts } from '../hooks/useLMS';
import { useToast } from '../context/ToastContext';
import { Loader } from '../components/Loader';
import { 
  Lock, Download, FileText, ChevronDown, ChevronRight, 
  Award, Clock, ArrowRight, Menu, X, HelpCircle, Video, CheckCircle2,
  Maximize2, Minimize2, Calculator, Headphones, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

interface ExamAttempt {
  status: 'pass' | 'fail';
  obtainedMarks: number;
  attemptCount: number;
  timeTaken?: number;
}

interface Exam {
  _id: string;
  title: string;
  description?: string;
  totalMarks: number;
  passingMarks: number;
  timeLimit: number;
  priority?: number;
  attempt?: ExamAttempt | null;
}

interface Lesson {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  videoLink?: string;
  duration?: string;
  isUnlocked: boolean;
  practiceMaterial?: string;
  isCompleted?: boolean;
  exams?: Exam[];
}

interface SubCourse {
  _id: string;
  title: string;
  courseLessonsAssigned?: Lesson[];
}

interface Course {
  _id: string;
  name: string;
  courseCurriculumIds?: SubCourse[];
  courseLessonIds?: Lesson[];
}

// Helper to parse YouTube URLs to embed URLs
const getEmbedUrl = (url: string) => {
  if (!url) return '';
  
  let embedUrl = url;
  if (!url.includes('youtube.com/embed/')) {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=2&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=0`;
    }
  } else {
    const separator = embedUrl.includes('?') ? '&' : '?';
    if (!embedUrl.includes('controls=')) {
      embedUrl = `${embedUrl}${separator}autoplay=0&controls=2&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=0`;
    }
  }
  
  return embedUrl;
};

// Get icon component based on exam title/type
const getExamTypeIcon = (title: string) => {
  const lower = (title || '').toLowerCase();
  if (lower.includes('calculation') || lower.includes('calc')) return Calculator;
  if (lower.includes('audio') || lower.includes('listening')) return Headphones;
  if (lower.includes('image') || lower.includes('visual') || lower.includes('picture')) return Image;
  if (lower.includes('text') || lower.includes('reading') || lower.includes('writing')) return FileText;
  return HelpCircle;
};

// Get color classes for exam type
const getExamTypeColor = (title: string, isSelected: boolean, isUnlocked: boolean) => {
  if (isSelected) return 'text-white';
  if (!isUnlocked) return 'text-slate-400/40';
  const lower = (title || '').toLowerCase();
  if (lower.includes('calculation') || lower.includes('calc')) return 'text-indigo-500';
  if (lower.includes('audio') || lower.includes('listening')) return 'text-amber-500';
  if (lower.includes('image') || lower.includes('visual') || lower.includes('picture')) return 'text-purple-500';
  if (lower.includes('text') || lower.includes('reading') || lower.includes('writing')) return 'text-blue-500';
  return 'text-orange-400';
};

export const CourseLMSPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { showToast } = useToast();

  const { mutate: completeLesson, isPending: isCompleting } = useCompleteLesson();

  const handleCompleteLesson = () => {
    if (courseId && selectedLessonId) {
      completeLesson(
        { courseId, courseLessonId: selectedLessonId },
        {
          onSuccess: () => {
            showToast('Lesson marked completed successfully! 🌟', 'success');
          },
          onError: (err: Error) => {
            const apiError = err as { response?: { data?: { message?: string } } };
            showToast(apiError?.response?.data?.message || 'Failed to complete lesson.', 'error');
          }
        }
      );
    }
  };

  // Queries
  const { data: courseRes, isLoading: courseLoading } = useCourse(courseId || '');
  const course = courseRes?.data as Course | undefined;

  // Selected Lesson State
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  
  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedCurriculums, setExpandedCurriculums] = useState<Record<string, boolean>>({});
  // Track previous course ID for adjusting state during render
  const [prevCourseId, setPrevCourseId] = useState<string | null>(null);

  if (course && course._id !== prevCourseId) {
    setPrevCourseId(course._id);

    let firstUnlockedId: string | null = null;
    const initialExpanded: Record<string, boolean> = {};

    if (course.courseCurriculumIds && course.courseCurriculumIds.length > 0) {
      for (const curr of course.courseCurriculumIds) {
        const unlockedLesson = curr.courseLessonsAssigned?.find((l: Lesson) => l.isUnlocked);
        if (unlockedLesson) {
          firstUnlockedId = unlockedLesson._id;
          initialExpanded[curr._id] = true;
          break;
        }
      }
    } else if (course.courseLessonIds && course.courseLessonIds.length > 0) {
      const unlockedLesson = course.courseLessonIds.find((l: Lesson) => l.isUnlocked);
      if (unlockedLesson) {
        firstUnlockedId = unlockedLesson._id;
      }
    }

    if (firstUnlockedId) {
      setSelectedLessonId(firstUnlockedId);
      setSelectedExamId(null);
    }
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedCurriculums(initialExpanded);
    }
  }

  // Fullscreen container logic for blocking YouTube interactions in fullscreen
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs) {
        // Delegate focus to iframe or video when entering fullscreen
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.focus();
          } else if (videoRef.current) {
            videoRef.current.focus();
          }
        }, 150);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcut listener for Arrow keys, J/L keys (10s seek), and Space (play/pause)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Handle when player container is in fullscreen
      if (document.fullscreenElement && playerContainerRef.current?.contains(document.fullscreenElement)) {
        const targetKeys = ['ArrowLeft', 'ArrowRight', 'j', 'J', 'l', 'L', ' ', 'k', 'K'];
        if (targetKeys.includes(e.key)) {
          if (iframeRef.current && document.activeElement !== iframeRef.current) {
            iframeRef.current.focus();
          } else if (videoRef.current) {
            if (document.activeElement !== videoRef.current) {
              videoRef.current.focus();
            }
            // Explicitly control HTML5 video skip
            if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
              videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
              e.preventDefault();
            } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
              videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
              e.preventDefault();
            } else if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
              if (videoRef.current.paused) {
                videoRef.current.play();
              } else {
                videoRef.current.pause();
              }
              e.preventDefault();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, []);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => {
          if (iframeRef.current) iframeRef.current.focus();
          else if (videoRef.current) videoRef.current.focus();
        }, 150);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Determine active lesson details
  let activeLesson: Lesson | null | undefined = null;
  if (selectedLessonId && course) {
    if (course.courseCurriculumIds && course.courseCurriculumIds.length > 0) {
      for (const curr of course.courseCurriculumIds) {
        const found = curr.courseLessonsAssigned?.find((l: Lesson) => l._id === selectedLessonId);
        if (found) {
          activeLesson = found;
          break;
        }
      }
    } else if (course.courseLessonIds) {
      activeLesson = course.courseLessonIds.find((l: Lesson) => l._id === selectedLessonId);
    }
  }

  // Determine correct course ID for exam query (sub-course ID for merged courses, parent course ID for single courses)
  let targetCourseId = courseId || '';
  if (course && course.courseCurriculumIds && course.courseCurriculumIds.length > 0 && selectedLessonId) {
    for (const subCourse of course.courseCurriculumIds) {
      const hasLesson = subCourse.courseLessonsAssigned?.some((l: Lesson) => l._id === selectedLessonId);
      if (hasLesson) {
        targetCourseId = subCourse._id;
        break;
      }
    }
  }

  // Determine which exam to view
  const activeExam = selectedExamId 
    ? activeLesson?.exams?.find(e => e._id === selectedExamId)
    : (activeLesson?.exams && activeLesson.exams.length > 0 ? activeLesson.exams[0] : null);

  // Fetch Exam for selected lesson (fallback/compatibility check)
  const { data: examRes } = useExamForLesson(
    targetCourseId,
    (selectedExamId ? '' : selectedLessonId) || '' // Skip query if a specific exam is selected or use as fallback
  );

  const exam = (activeExam || (examRes?.data?.exam_data?.length > 0 ? examRes.data.exam_data[0] : null)) as Exam | null;

  // Fetch Exam Attempts
  const { data: attemptsRes } = useExamAttempts(
    targetCourseId,
    exam?._id || ''
  );

  const attempts = attemptsRes?.data?.attempt_data || [];
  const latestAttempt = attempts.length > 0 ? attempts[0] : null;

  if (courseLoading) {
    return <Loader />;
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Classroom not found</h2>
        <p className="text-slate-500 mt-2">Could not retrieve classroom contents.</p>
      </div>
    );
  }

  const toggleAccordion = (id: string) => {
    setExpandedCurriculums(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!lesson.isUnlocked) {
      showToast('This lesson is locked. Complete the previous lesson exam to unlock!', 'warning');
      return;
    }
    setSelectedLessonId(lesson._id);
    setSelectedExamId(null);
    setSidebarOpen(false);
  };

  const handleExamClick = (lesson: Lesson, exam: Exam) => {
    if (!lesson.isUnlocked) {
      showToast('This lesson is locked. Complete the previous lesson exam to unlock!', 'warning');
      return;
    }
    setSelectedLessonId(lesson._id);
    setSelectedExamId(exam._id);
    setSidebarOpen(false);
  };

  const isMerged = course.courseCurriculumIds && course.courseCurriculumIds.length > 0;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900/40 flex flex-col xl:flex-row transition-all duration-200">
      
      {/* Mobile Sidebar Toggle */}
      <div className="xl:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-orange-100 dark:border-slate-700">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300"
        >
          <Menu size={20} className="text-orange-500" />
          Course Curriculum
        </button>
        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 truncate max-w-50">
          {course.name}
        </span>
      </div>

      {/* LEFT NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 border-r border-orange-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300
        xl:relative xl:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'xl:w-20' : 'xl:w-80'}
      `}>
        <div className={`p-4 border-b border-orange-50 dark:border-slate-800 flex items-center ${
          isSidebarCollapsed ? 'justify-center' : 'justify-between'
        } overflow-hidden animate-fade-in`}>
          {!isSidebarCollapsed && (
            <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-base truncate">
              Course Syllabus
            </h3>
          )}
          <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? '' : 'mx-auto xl:mx-0'}`}>
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden xl:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} className="rotate-90" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="xl:hidden text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isSidebarCollapsed ? (
            // Collapsed view: flat list of all lessons and exams in sequence
            <div className="flex flex-col items-center gap-3">
              {(() => {
                // Flatten all lessons
                let flatLessons: Lesson[] = [];
                if (isMerged && course.courseCurriculumIds) {
                  for (const subCourse of course.courseCurriculumIds) {
                    flatLessons = flatLessons.concat(subCourse.courseLessonsAssigned || []);
                  }
                } else {
                  flatLessons = course.courseLessonIds || [];
                }

                const items: React.ReactNode[] = [];
                let lessonIndex = 0;
                flatLessons.forEach((lesson: Lesson) => {
                  lessonIndex++;
                  const isLessonSelected = lesson._id === selectedLessonId && !selectedExamId;
                  
                  // Render lesson button
                  items.push(
                    <button
                      key={lesson._id}
                      onClick={() => handleLessonClick(lesson)}
                      disabled={!lesson.isUnlocked}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center relative transition-all border-2 ${
                        lesson.isCompleted
                          ? 'border-emerald-500 dark:border-emerald-400'
                          : 'border-transparent'
                      } ${
                        isLessonSelected
                          ? 'bg-orange-600 text-white shadow-md scale-105'
                          : lesson.isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 hover:bg-emerald-100'
                          : lesson.isUnlocked
                          ? 'bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 hover:bg-orange-100'
                          : 'text-slate-400 opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                      }`}
                      title={`${lessonIndex}. ${lesson.title} ${lesson.isUnlocked ? '' : '(Locked)'}`}
                    >
                      {lesson.isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : lesson.isUnlocked ? (
                        isLessonSelected ? <Video size={16} /> : <Video size={16} />
                      ) : (
                        <Lock size={16} />
                      )}
                    </button>
                  );

                  // Render exam buttons if lesson contains exams
                  if (lesson.exams && lesson.exams.length > 0) {
                    lesson.exams.forEach((exam: Exam) => {
                      const isExamSelected = selectedExamId === exam._id;
                      const isPassed = exam.attempt?.status === 'pass';
                      const ExamIcon = getExamTypeIcon(exam.title);
                      items.push(
                        <button
                          key={exam._id}
                          onClick={() => handleExamClick(lesson, exam)}
                          disabled={!lesson.isUnlocked}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center relative transition-all border ${
                            isPassed
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                              : 'border-transparent'
                          } ${
                            isExamSelected
                              ? 'bg-orange-500 text-white shadow-sm scale-105'
                              : lesson.isUnlocked
                              ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                              : 'text-slate-400 opacity-40 cursor-not-allowed bg-slate-100'
                          }`}
                          title={`${exam.title || 'Lesson Exam'} ${lesson.isUnlocked ? '' : '(Locked)'}`}
                        >
                          {lesson.isUnlocked ? (
                            isPassed ? <Award size={14} className="text-emerald-500" /> : <ExamIcon size={14} className={getExamTypeColor(exam.title, isExamSelected, lesson.isUnlocked)} />
                          ) : (
                            <Lock size={12} />
                          )}
                        </button>
                      );
                    });
                  }
                });
                return items;
              })()}
            </div>
          ) : (
            // Expanded view
            isMerged ? (
              course.courseCurriculumIds?.map((subCourse: SubCourse) => {
                const isOpen = !!expandedCurriculums[subCourse._id];
                return (
                  <div key={subCourse._id} className="space-y-1">
                    <button
                      onClick={() => toggleAccordion(subCourse._id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-50/30 dark:bg-orange-950/10 text-left font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                    >
                      <span className="truncate pr-2">{subCourse.title}</span>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-2 space-y-1.5 pt-1"
                        >
                          {subCourse.courseLessonsAssigned?.map((lesson: Lesson) => {
                            const isSelected = lesson._id === selectedLessonId;
                            const isLessonSelected = isSelected && !selectedExamId;
                            const isLessonActiveContext = isSelected && !!selectedExamId;
                            return (
                              <div key={lesson._id} className="space-y-1">
                                <button
                                  onClick={() => handleLessonClick(lesson)}
                                  disabled={!lesson.isUnlocked}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                                    isLessonSelected
                                      ? 'bg-orange-600 text-white shadow-md'
                                      : isLessonActiveContext
                                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-900/40'
                                      : lesson.isUnlocked
                                      ? 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'
                                      : 'text-slate-400 opacity-60 cursor-not-allowed'
                                  }`}
                                >
                                  {lesson.isCompleted ? (
                                    <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                                  ) : lesson.isUnlocked ? (
                                    <Video size={14} className={isLessonSelected ? 'text-white shrink-0' : 'text-orange-500 shrink-0'} />
                                  ) : (
                                    <Lock size={14} className="text-slate-400 shrink-0" />
                                  )}
                                  <span className="truncate">{lesson.title}</span>
                                </button>
                                {lesson.exams && lesson.exams.length > 0 && (
                                  <div className="pl-6 space-y-1 pt-0.5 pb-1">
                                    {lesson.exams.map((exam: Exam) => {
                                      const isExamSelected = selectedExamId === exam._id;
                                      const isPassed = exam.attempt?.status === 'pass';
                                      const ExamIcon = getExamTypeIcon(exam.title);
                                      return (
                                        <button
                                          key={exam._id}
                                          onClick={() => handleExamClick(lesson, exam)}
                                          disabled={!lesson.isUnlocked}
                                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-all ${
                                            isExamSelected
                                              ? 'bg-orange-500 text-white shadow-sm'
                                              : lesson.isUnlocked
                                              ? 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/20 dark:hover:bg-orange-950/5'
                                              : 'text-slate-400/50 cursor-not-allowed'
                                          }`}
                                        >
                                          {isPassed ? (
                                            <Award size={12} className="text-emerald-500 shrink-0" />
                                          ) : lesson.isUnlocked ? (
                                            <ExamIcon size={12} className={`${getExamTypeColor(exam.title, isExamSelected, lesson.isUnlocked)} shrink-0`} />
                                          ) : (
                                            <Lock size={12} className="text-slate-400/40 shrink-0" />
                                          )}
                                          <span className="truncate">{exam.title || 'Lesson Exam'}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="space-y-1.5">
                {course.courseLessonIds?.map((lesson: Lesson) => {
                  const isSelected = lesson._id === selectedLessonId;
                  const isLessonSelected = isSelected && !selectedExamId;
                  const isLessonActiveContext = isSelected && !!selectedExamId;
                  return (
                    <div key={lesson._id} className="space-y-1">
                      <button
                        onClick={() => handleLessonClick(lesson)}
                        disabled={!lesson.isUnlocked}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold transition-all ${
                          isLessonSelected
                            ? 'bg-orange-600 text-white shadow-md'
                            : isLessonActiveContext
                            ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-900/40'
                            : lesson.isUnlocked
                            ? 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'
                            : 'text-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {lesson.isCompleted ? (
                          <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                        ) : lesson.isUnlocked ? (
                          <Video size={14} className={isLessonSelected ? 'text-white shrink-0' : 'text-orange-500 shrink-0'} />
                        ) : (
                          <Lock size={14} className="text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </button>
                      {lesson.exams && lesson.exams.length > 0 && (
                        <div className="pl-6 space-y-1 pt-0.5 pb-1">
                          {lesson.exams.map((exam: Exam) => {
                            const isExamSelected = selectedExamId === exam._id;
                            const isPassed = exam.attempt?.status === 'pass';
                            const ExamIcon = getExamTypeIcon(exam.title);
                            return (
                              <button
                                key={exam._id}
                                onClick={() => handleExamClick(lesson, exam)}
                                disabled={!lesson.isUnlocked}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-all ${
                                  isExamSelected
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : lesson.isUnlocked
                                    ? 'text-slate-600 dark:text-slate-400 hover:bg-orange-50/20 dark:hover:bg-orange-950/5'
                                    : 'text-slate-400/50 cursor-not-allowed'
                                }`}
                              >
                                {isPassed ? (
                                  <Award size={12} className="text-emerald-500 shrink-0" />
                                ) : lesson.isUnlocked ? (
                                  <ExamIcon size={12} className={`${getExamTypeColor(exam.title, isExamSelected, lesson.isUnlocked)} shrink-0`} />
                                ) : (
                                  <Lock size={12} className="text-slate-400/40 shrink-0" />
                                )}
                                <span className="truncate">{exam.title || 'Lesson Exam'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm xl:hidden" />
      )}

      {/* CENTER & RIGHT COLUMN GRID */}
      <motion.main
        variants={pageChildVariants}
        initial="initial"
        animate="animate"
        className="grow p-4 sm:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8"
      >
              {/* CENTER AREA */}
        <div className="xl:col-span-2 space-y-6">
          {selectedExamId && exam ? (
            <div className="ui-card p-6 sm:p-8 space-y-6 animate-fade-in">
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-orange-100 dark:border-slate-800">
                <span className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-3xl shadow-sm">
                  📝
                </span>
                <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white leading-tight">
                  {exam.title || 'Lesson Exam'}
                </h2>
                {exam.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                    {exam.description}
                  </p>
                )}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  <span>Lesson: {activeLesson?.title}</span>
                </div>
              </div>

              {/* Exam Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <span className="text-slate-400 text-xs font-semibold mb-1">Total Marks</span>
                  <span className="font-extrabold text-lg text-slate-800 dark:text-white">{exam.totalMarks} Marks</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <span className="text-slate-400 text-xs font-semibold mb-1">Passing Marks</span>
                  <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{exam.passingMarks} Marks</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <span className="text-slate-400 text-xs font-semibold mb-1">Time Limit</span>
                  <span className="font-extrabold text-lg text-slate-800 dark:text-white">{exam.timeLimit} Minutes</span>
                </div>
              </div>

              {/* Attempt History Card */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Your Attempt Status</h4>
                {latestAttempt ? (
                  <div className="p-5 rounded-2xl border border-orange-100/50 dark:border-slate-800/40 bg-orange-50/10 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs ${
                        latestAttempt.status === 'pass' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' 
                          : 'bg-red-50 dark:bg-red-950/30 text-red-600'
                      }`}>
                        {latestAttempt.status === 'pass' ? '🎉' : '❌'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                            {latestAttempt.status === 'pass' ? 'Exam Passed' : 'Exam Failed'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            latestAttempt.status === 'pass'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          }`}>
                            {latestAttempt.status === 'pass' ? 'Passed' : 'Needs Review'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Score: <span className="font-bold text-slate-700 dark:text-slate-350">{latestAttempt.obtainedMarks} / {exam.totalMarks}</span> (Attempts: {latestAttempt.attemptCount || 1})
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/exam/${exam._id}?courseId=${courseId}`}
                      className="ui-button-primary py-3 px-6 text-xs gap-2 shrink-0 w-full sm:w-auto justify-center"
                    >
                      <span>{latestAttempt.status === 'pass' ? 'Retake Exam' : 'Re-take Timed Exam'}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl border border-orange-100/50 dark:border-slate-800/40 bg-orange-50/10 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Not Attempted Yet</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Test your understanding of the lesson. Passing the exam is required to unlock subsequent content.
                      </p>
                    </div>
                    <Link
                      to={`/exam/${exam._id}?courseId=${courseId}`}
                      className="ui-button-primary py-3 px-6 text-xs gap-2 shrink-0 w-full sm:w-auto justify-center"
                    >
                      <span>Start Timed Exam</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : activeLesson ? (
            <>
              {/* Player — uses videoLink directly from lesson */}
              {activeLesson.videoLink ? (
                <div 
                  ref={playerContainerRef}
                  className="group relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-900 border border-orange-100 dark:border-slate-800 shadow-lg"
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => {
                    if (iframeRef.current) iframeRef.current.focus();
                    else if (videoRef.current) videoRef.current.focus();
                  }}
                >
                  {activeLesson.videoLink.includes('youtube.com') || activeLesson.videoLink.includes('youtu.be') ? (
                    <>
                      <iframe
                        ref={iframeRef}
                        src={getEmbedUrl(activeLesson.videoLink)}
                        title={activeLesson.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                      
                      {/* Top bar visual shield + branding */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-14 bg-linear-to-b from-slate-950/90 to-slate-950/20 backdrop-blur-[2px] z-10 flex items-center px-6 pointer-events-none select-none animate-top-bar-fade group-hover:opacity-100! group-hover:backdrop-blur-[2px]! transition-all duration-500"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse"></span>
                          <span className="text-sm font-bold text-white tracking-wide truncate max-w-70 sm:max-w-md">
                            {activeLesson.title || 'Course Video'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Bottom-right visual shield + branding */}
                      <div className="absolute bottom-3 right-3 z-10 pointer-events-none select-none">
                        <div className="px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-[9px] font-extrabold uppercase tracking-widest text-orange-200">
                          Shining Sparrow
                        </div>
                      </div>

                      {/* Invisible pointer-events overlays to capture clicks in key redirect regions */}
                      <div className="absolute top-0 left-0 right-0 h-[16%] z-10 bg-transparent cursor-default pointer-events-auto" />
                      <div className="absolute bottom-0 left-0 w-[20%] h-[16%] z-10 bg-transparent cursor-default pointer-events-auto" />
                      <div className="absolute bottom-0 right-0 w-[38%] h-[16%] z-10 bg-transparent cursor-default pointer-events-auto" />

                      {/* Custom Fullscreen Toggle Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="absolute bottom-2 left-14 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm border border-white/20 shadow-lg cursor-pointer transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                      >
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      </button>
                    </>
                  ) : (
                    <video
                      ref={videoRef}
                      src={activeLesson.videoLink}
                      controls
                      poster={activeLesson.thumbnail || undefined}
                      className="absolute inset-0 w-full h-full"
                    ></video>
                  )}
                </div>
              ) : (
                <div className="aspect-video w-full rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-center border dark:border-slate-800 shadow-sm">
                  <div className="space-y-2 p-6 max-w-sm">
                    <Video size={36} className="text-slate-300 mx-auto" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">No Video Lectures</h3>
                    <p className="text-xs text-slate-400 leading-normal">This lesson doesn't contain any video lectures.</p>
                  </div>
                </div>
              )}

              {/* Lesson Details */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
                    {activeLesson.title}
                  </h2>
                  {activeLesson.subtitle && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                      {activeLesson.subtitle}
                    </p>
                  )}
                  {activeLesson.description && (
                    <div 
                      className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2 lesson-description"
                      dangerouslySetInnerHTML={{ __html: activeLesson.description }}
                    />
                  )}
                  {activeLesson.duration && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                      <Clock size={11} /> {activeLesson.duration}
                    </span>
                  )}
                </div>

                {/* PDF Attachment */}
                {activeLesson.practiceMaterial && (
                  <div className="ui-card p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-300 rounded-xl">
                        <FileText size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Practice Sheet PDF</span>
                        <span className="block text-[10px] text-slate-400">View worksheets for this lesson</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPdfViewerUrl(activeLesson.practiceMaterial || null)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-orange-600 dark:text-orange-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="ui-card border border-dashed text-center py-24">
              <HelpCircle className="text-slate-400 mx-auto mb-4" size={40} />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Select a Lesson</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2">
                Click on any unlocked lesson from the syllabus navigation sidebar to begin learning.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-1 self-start w-full">
          {activeLesson && (
            <div className="sticky top-24 ui-card space-y-6 p-6">
              {activeLesson.exams && activeLesson.exams.length > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-2 text-center border-b dark:border-slate-700 pb-5">
                    <span className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl mx-auto">
                      📝
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                      Lesson Exams
                    </h3>
                    <p className="text-xs text-slate-400">
                      Complete all exams to unlock the next lesson.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {activeLesson.exams.map((ex: Exam, index: number) => {
                      const isExPassed = ex.attempt?.status === 'pass';
                      const isSelected = selectedExamId === ex._id;
                      return (
                        <div 
                          key={ex._id} 
                          className={`p-4 rounded-2xl border transition-all ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-500/5' 
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                {index + 1}. {ex.title || 'Lesson Exam'}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                {ex.totalMarks} Marks • {ex.timeLimit}m
                              </span>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              isExPassed
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : ex.attempt
                                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              {isExPassed ? 'Passed' : ex.attempt ? 'Failed' : 'Pending'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleExamClick(activeLesson!, ex)}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold text-center transition-all ${
                                isSelected 
                                  ? 'bg-orange-600 text-white shadow-sm' 
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {isSelected ? 'Viewing' : 'Details'}
                            </button>
                            
                            <Link
                              to={`/exam/${ex._id}?courseId=${courseId}`}
                              className="flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold text-center bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 hover:text-orange-700"
                            >
                              {isExPassed ? 'Retake' : 'Start'}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeLesson.isCompleted ? (
                <div className="text-center py-10 space-y-4">
                  <span className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto shadow-sm">
                    🎉
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                    Lesson Completed!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                    Great job! You have finished this lesson. Click on the next lesson to continue your math adventure!
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold">
                    <span>Passed & Completed</span>
                    <Award size={12} className="shrink-0" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4">
                  <span className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl mx-auto">
                    📖
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                    Complete Lesson
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                    Finished watching the videos and doing the worksheets? Mark this lesson completed to record your progress!
                  </p>
                  
                  <button
                    onClick={handleCompleteLesson}
                    disabled={isCompleting}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-250 dark:shadow-none hover:shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    {isCompleting ? (
                      <span>Saving Progress...</span>
                    ) : (
                      <>
                        <span>Mark as Completed</span>
                        <CheckCircle2 size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </motion.main>

      {/* Secure PDF Viewer Modal */}
      <AnimatePresence>
        {pdfViewerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPdfViewerUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">Practice Sheet PDF</h3>
                    <p className="text-[10px] text-slate-400">Secure view-only mode</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setPdfViewerUrl(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Secure PDF iFrame Container */}
              <div className="grow bg-slate-950 p-2 relative flex items-center justify-center">
                {/* Overlay covering iframe controls / protecting right click */}
                <div 
                  className="absolute inset-0 bg-transparent z-10"
                  onContextMenu={(e) => e.preventDefault()}
                />
                
                <iframe
                  src={`${pdfViewerUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  title="PDF Document"
                  className="w-full h-full rounded-2xl border-0 bg-slate-900 z-0"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
