import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCourse } from '../hooks/useCourses';
import { useCourseCurriculums, useExamForLesson, useCompleteLesson } from '../hooks/useLMS';
import { useToast } from '../context/ToastContext';
import { Loader } from '../components/Loader';
import { 
  Play, Lock, Unlock, Download, FileText, ChevronDown, ChevronRight, 
  Award, Clock, ArrowRight, Menu, X, HelpCircle, Video, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

interface Lesson {
  _id: string;
  title: string;
  subtitle?: string;
  isUnlocked: boolean;
  practiceMaterial?: string;
  isCompleted?: boolean;
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

interface Curriculum {
  _id: string;
  title: string;
  videoLink: string;
  duration?: string;
}

interface Exam {
  _id: string;
  totalMarks: number;
  passingMarks: number;
  timeLimit: number;
}

// Helper to parse YouTube URLs to embed URLs
const getEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  
  let videoId = '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    videoId = match[2];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : url;
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
          onError: (err: any) => {
            showToast(err?.response?.data?.message || 'Failed to complete lesson.', 'error');
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
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string | null>(null);
  
  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedCurriculums, setExpandedCurriculums] = useState<Record<string, boolean>>({});
  // Track previous course ID for adjusting state during render
  const [prevCourseId, setPrevCourseId] = useState<string | null>(null);

  // Determine correct course ID for curriculum and exam queries (sub-course ID for merged courses, parent course ID for single courses)
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

  // Fetch Curriculums and Exam for selected lesson using targetCourseId
  const { data: curriculumsRes } = useCourseCurriculums(
    targetCourseId,
    selectedLessonId || ''
  );
  
  const { data: examRes } = useExamForLesson(
    targetCourseId,
    selectedLessonId || ''
  );

  const curriculums = (curriculumsRes?.data?.course_curriculum_data || []) as Curriculum[];
  const exam = (examRes?.data?.exam_data?.length > 0 ? examRes.data.exam_data[0] : null) as Exam | null;

  // Compute active video fallback during render to avoid useEffect dependency cascading renders
  const currentVideoUrl = activeVideoUrl ?? (curriculums.length > 0 ? curriculums[0].videoLink : null);
  const currentVideoTitle = activeVideoTitle ?? (curriculums.length > 0 ? curriculums[0].title : null);

  // Auto-select first unlocked lesson on load directly during render when course changes.
  // This avoids calling setState inside useEffect, preventing cascading renders and linter warnings.
  if (course && course._id !== prevCourseId) {
    setPrevCourseId(course._id);
    
    let firstUnlockedId: string | null = null;
    const initialExpanded: Record<string, boolean> = {};
    
    if (course.courseCurriculumIds && course.courseCurriculumIds.length > 0) {
      // Merged Course
      for (const curr of course.courseCurriculumIds) {
        const unlockedLesson = curr.courseLessonsAssigned?.find((l: Lesson) => l.isUnlocked);
        if (unlockedLesson) {
          firstUnlockedId = unlockedLesson._id;
          initialExpanded[curr._id] = true;
          break;
        }
      }
    } else if (course.courseLessonIds && course.courseLessonIds.length > 0) {
      // Single Course
      const unlockedLesson = course.courseLessonIds.find((l: Lesson) => l.isUnlocked);
      if (unlockedLesson) {
        firstUnlockedId = unlockedLesson._id;
      }
    }

    if (firstUnlockedId) {
      setSelectedLessonId(firstUnlockedId);
    }
    if (Object.keys(initialExpanded).length > 0) {
      setExpandedCurriculums(initialExpanded);
    }
  }

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

  // Determine active lesson details
  let activeLesson: Lesson | null | undefined = null;
  if (selectedLessonId) {
    if (course && course.courseCurriculumIds && course.courseCurriculumIds.length > 0) {
      for (const curr of course.courseCurriculumIds) {
        const found = curr.courseLessonsAssigned?.find((l: Lesson) => l._id === selectedLessonId);
        if (found) {
          activeLesson = found;
          break;
        }
      }
    } else if (course && course.courseLessonIds) {
      activeLesson = course.courseLessonIds.find((l: Lesson) => l._id === selectedLessonId);
    }
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
    setActiveVideoUrl(null); // Reset selected video on lesson change to trigger fallback
    setActiveVideoTitle(null);
    setSidebarOpen(false);
  };

  const isMerged = course.courseCurriculumIds && course.courseCurriculumIds.length > 0;

  return (
    <div className="min-h-[85vh] bg-slate-50 dark:bg-slate-900/40 flex flex-col md:flex-row transition-all duration-200">
      
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-orange-100 dark:border-slate-700">
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
        md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-80'}
      `}>
        <div className={`p-4 border-b border-orange-50 dark:border-slate-800 flex items-center ${
          isSidebarCollapsed ? 'justify-center' : 'justify-between'
        } overflow-hidden animate-fade-in`}>
          {!isSidebarCollapsed && (
            <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-base truncate">
              Course Syllabus
            </h3>
          )}
          <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? '' : 'mx-auto md:mx-0'}`}>
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} className="rotate-90" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isSidebarCollapsed ? (
            // Collapsed view: flat list of all lessons in sequence
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

                return flatLessons.map((lesson: Lesson, index: number) => {
                  const isSelected = lesson._id === selectedLessonId;
                  return (
                    <button
                      key={lesson._id}
                      onClick={() => handleLessonClick(lesson)}
                      disabled={!lesson.isUnlocked}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center relative transition-all border-2 ${
                        lesson.isCompleted
                          ? 'border-emerald-500 dark:border-emerald-400'
                          : 'border-transparent'
                      } ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-md scale-105'
                          : lesson.isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 hover:bg-emerald-100'
                          : lesson.isUnlocked
                          ? 'bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 hover:bg-orange-100'
                          : 'text-slate-400 opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                      }`}
                      title={`${index + 1}. ${lesson.title} ${lesson.isUnlocked ? '' : '(Locked)'}`}
                    >
                      {lesson.isCompleted ? (
                        <span className="font-bold text-xs">{index + 1}</span>
                      ) : lesson.isUnlocked ? (
                        isSelected ? <Unlock size={16} /> : <span className="font-bold text-xs">{index + 1}</span>
                      ) : (
                        <Lock size={16} />
                      )}
                    </button>
                  );
                });
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
                            return (
                              <button
                                key={lesson._id}
                                onClick={() => handleLessonClick(lesson)}
                                disabled={!lesson.isUnlocked}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-orange-600 text-white shadow-md'
                                    : lesson.isUnlocked
                                    ? 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'
                                    : 'text-slate-400 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                {lesson.isCompleted ? (
                                  <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                                ) : lesson.isUnlocked ? (
                                  <Unlock size={14} className={isSelected ? 'text-white shrink-0' : 'text-orange-500 shrink-0'} />
                                ) : (
                                  <Lock size={14} className="text-slate-400 shrink-0" />
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </button>
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
                  return (
                    <button
                      key={lesson._id}
                      onClick={() => handleLessonClick(lesson)}
                      disabled={!lesson.isUnlocked}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-md'
                          : lesson.isUnlocked
                          ? 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10'
                          : 'text-slate-400 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {lesson.isCompleted ? (
                        <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10 shrink-0" />
                      ) : lesson.isUnlocked ? (
                        <Unlock size={14} className={isSelected ? 'text-white shrink-0' : 'text-orange-500 shrink-0'} />
                      ) : (
                        <Lock size={14} className="text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden" />
      )}

      {/* CENTER & RIGHT COLUMN GRID */}
      <motion.main
        variants={pageChildVariants}
        initial="initial"
        animate="animate"
        className="grow p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        
        {/* CENTER AREA */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <>
              {/* Player */}
              {currentVideoUrl ? (
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-900 border border-orange-100 dark:border-slate-800 shadow-lg">
                  {currentVideoUrl.includes('youtube.com') || currentVideoUrl.includes('youtu.be') ? (
                    <iframe
                      src={getEmbedUrl(currentVideoUrl)}
                      title={currentVideoTitle || 'Lecture video'}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      src={currentVideoUrl}
                      controls
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
                </div>

                {/* PDF Attachments */}
                {activeLesson.practiceMaterial && (
                  <div className="ui-card p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-300 rounded-xl">
                        <FileText size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Practice Sheet PDF</span>
                        <span className="block text-[10px] text-slate-400">Download worksheets for this lesson</span>
                      </div>
                    </div>
                    <a
                      href={activeLesson.practiceMaterial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-orange-600 dark:text-orange-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                )}
              </div>

              {/* Video parts */}
              {curriculums.length > 1 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lesson Parts ({curriculums.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {curriculums.map((curr: Curriculum, index: number) => {
                      const isActive = currentVideoUrl === curr.videoLink;
                      return (
                        <button
                          key={curr._id}
                          onClick={() => {
                            setActiveVideoUrl(curr.videoLink);
                            setActiveVideoTitle(curr.title);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/30 dark:border-slate-700 dark:text-orange-400'
                              : 'bg-white border-slate-100 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-900'}`}>
                            <Play size={12} className="fill-current" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold truncate">Part {index + 1}: {curr.title}</span>
                            <span className="block text-[10px] text-slate-400">{curr.duration || 'Video'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="ui-card border border-dashed text-center py-24">
              <HelpCircle className="text-slate-350 mx-auto mb-4" size={40} />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Select a Lesson</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2">
                Click on any unlocked lesson from the syllabus navigation sidebar to begin learning.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1">
          {activeLesson && (
            <div className="sticky top-24 ui-card space-y-6 p-6">
              {exam ? (
                <div className="space-y-6">
                  <div className="space-y-2 text-center border-b dark:border-slate-700 pb-5">
                    <span className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl mx-auto">
                      📝
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white leading-tight">
                      Lesson Exam Center
                    </h3>
                    <p className="text-xs text-slate-400">
                      Passing unlocks the next lesson.
                    </p>
                  </div>

                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-orange-100/50 dark:border-slate-800/40 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Award size={14} /> Total Score:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{exam.totalMarks} Marks</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Passing Mark:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{exam.passingMarks} Marks</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock size={14} /> Time Limit:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {Math.floor(exam.timeLimit / 60)} minutes
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/exam/${exam._id}?courseId=${courseId}`}
                    className="ui-button-primary w-full py-3.5 text-xs gap-2"
                  >
                    <span>Start Timed Exam</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : activeLesson?.isCompleted ? (
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
                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold inline-block">
                    Passed & Completed 🌟
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
    </div>
  );
};
