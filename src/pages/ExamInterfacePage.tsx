import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useExam, useSubmitExam } from '../hooks/useLMS';
import { useToast } from '../context/ToastContext';
import { Loader } from '../components/Loader';
import { 
  ArrowLeft, ArrowRight, Play, Volume2, Clock, AlertTriangle, 
  CheckCircle2, XCircle, RotateCcw, ShieldCheck, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

interface Question {
  _id: string;
  questionText: string;
  questionType?: string;
  questionImage?: string;
  questionAudio?: string;
  correctAnswer?: string;
}

interface Exam {
  _id: string;
  title: string;
  description?: string;
  timeLimit: number;
  totalMarks: number;
  passingMarks: number;
  questionIds?: Question[];
}

interface ExamResult {
  status: 'pass' | 'fail';
  obtainedMarks: number;
  totalMarks: number;
  timeTaken: number;
  attemptCount: number;
  answers?: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;
}

const parseCalculationText = (text: string) => {
  if (!text) return null;

  // Determine if it has newlines
  const isVertical = text.includes('\n');

  if (isVertical) {
    // Split by newlines, clean up empty lines
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Check if it's primarily a calculation list (lines starting with signs or digits)
    const isNumeric = lines.every(line => /^[+-]?\d+$/.test(line.replace(/\s+/g, '')));
    if (!isNumeric) return null;

    return {
      isVertical: true,
      items: lines.map(line => {
        const clean = line.replace(/\s+/g, '');
        const match = clean.match(/^([+-])?(\d+)$/);
        if (match) {
          return {
            sign: match[1] || '',
            val: match[2]
          };
        }
        return { sign: '', val: clean };
      })
    };
  } else {
    // Horizontal or space-separated list
    let cleanText = text.replace(/\band\b/gi, ' ').replace(/,/g, ' ');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    const tokens = cleanText.split(' ');
    const items: { sign: string; val: string }[] = [];
    let pendingSign = '';
    let hasNumbers = false;

    for (const token of tokens) {
      if (token === '+' || token === '-') {
        pendingSign = token;
      } else if (/^[+-]?\d+$/.test(token)) {
        const match = token.match(/^([+-])?(\d+)$/);
        if (match) {
          const sign = pendingSign || match[1] || '';
          items.push({
            sign,
            val: match[2]
          });
          hasNumbers = true;
          pendingSign = '';
        }
      } else {
        return null;
      }
    }

    if (!hasNumbers) return null;

    return {
      isVertical: false,
      items
    };
  }
};

export const ExamInterfacePage = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') || '';
  const { showToast } = useToast();

  // Queries & Mutations
  const { data: examRes, isLoading: examLoading } = useExam(examId || '');
  const exam = examRes?.data as Exam | undefined;
  const submitExamMutation = useSubmitExam();

  // Exam taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  
  // Submit Results state
  const [resultData, setResultData] = useState<ExamResult | null>(null);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);

  // Audio Playback states
  const [audioPlaying, setAudioPlaying] = useState<Record<string, boolean>>({});
  const [audioCountdown, setAudioCountdown] = useState<Record<string, number>>({});

  // Audio Playback Ref
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  const rawQuestions = exam?.questionIds;
  const questions = useMemo(() => rawQuestions || [], [rawQuestions]);

  const currentQuestion = questions[currentQuestionIndex];

  const parsedCalc = useMemo(() => {
    if (!currentQuestion || currentQuestion.questionType !== 'calculation') return null;
    return parseCalculationText(currentQuestion.questionText);
  }, [currentQuestion]);

  const handleExamSubmit = useCallback(async () => {
    setExamSubmitted(true);
    if (!exam) return;

    // Format answers payload
    const formattedAnswers = questions.map((q: Question) => ({
      questionId: q._id,
      answer: (answers[q._id] || '').trim(),
    }));

    try {
      const response = await submitExamMutation.mutateAsync({
        examId: exam._id,
        answers: formattedAnswers,
        timeTaken: timeTaken,
      });

      if (response && response.status === 200) {
        setResultData(response.data);
        if (response.data.status === 'pass') {
          showToast('Congratulations! You passed the exam!', 'success');
        } else {
          showToast('Exam completed, but you did not pass. Try again!', 'info');
        }
      } else {
        showToast(response.message || 'Submission failed', 'error');
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || 'Failed to submit exam. Please try again.';
      showToast(errMsg, 'error');
    }
  }, [exam, questions, answers, submitExamMutation, timeTaken, showToast]);

  // Confirm page exit during active exam
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStarted && !examSubmitted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examStarted, examSubmitted]);

  // Countdown timer loop
  useEffect(() => {
    if (!examStarted || examSubmitted || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      showToast('Time limit reached! Auto-submitting your answers...', 'warning');
      setTimeout(() => {
        handleExamSubmit();
      }, 0);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
      setTimeTaken(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examSubmitted, timeRemaining, handleExamSubmit, showToast]);

  if (examLoading) {
    return <Loader />;
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Exam not found</h2>
        <p className="text-slate-500 mt-2">Could not retrieve exam details.</p>
      </div>
    );
  }

  const handleStartExam = () => {
    if (exam) {
      setTimeRemaining(exam.timeLimit * 60);
      setExamStarted(true);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeTaken(0);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const playAudio = (questionId: string) => {
    if (audioPlaying[questionId] || audioCountdown[questionId] !== undefined) return;

    const audio = audioRefs.current[questionId];
    if (!audio) return;

    let count = 3;
    setAudioCountdown(prev => ({ ...prev, [questionId]: count }));

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setAudioCountdown(prev => ({ ...prev, [questionId]: count }));
      } else {
        clearInterval(timer);
        setAudioCountdown(prev => {
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error('Audio playback failed', err);
          showToast('Playback failed. Please click play again.', 'error');
        });
      }
    }, 1000);
  };

  // Timer formatter (e.g. 05:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. RESULT SCREEN
  if (examSubmitted && resultData) {
    const passed = resultData.status === 'pass';
    const activeQuestion = questions[activeReviewIndex];
    
    return (
      <motion.div
        variants={pageChildVariants}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto px-2 py-4 sm:px-4 sm:py-10 space-y-4 sm:space-y-8"
      >
        {/* Full Screen Countdown Overlay for Review Replay */}
        {activeQuestion && audioCountdown[activeQuestion._id] !== undefined && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md transition-all duration-300">
            <div className="text-center space-y-6">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-primary dark:text-brand-secondary animate-pulse">
                Audio Question Replay Starting In
              </div>
              <motion.div
                key={audioCountdown[activeQuestion._id]}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-9xl font-black text-white font-display select-none filter drop-shadow-[0_0_20px_rgba(232,100,36,0.3)]"
              >
                {audioCountdown[activeQuestion._id]}
              </motion.div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs px-6 leading-relaxed">
                Get ready to listen carefully.
              </div>
            </div>
          </div>
        )}
        
        {/* Pass/Fail Banner */}
        <div className={`p-4 sm:p-8 rounded-2xl sm:rounded-3xl text-center space-y-3 sm:space-y-4 border shadow-lg ${
          passed 
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50' 
            : 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50'
        }`}>
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl mx-auto ${
            passed ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600'
          }`}>
            {passed ? '🏆' : '❌'}
          </div>
          
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              {exam.title}
            </span>
            <h2 className={`font-display font-extrabold text-xl sm:text-3xl ${passed ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'}`}>
              {passed ? 'Exam Passed!' : 'Exam Attempt Failed'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {passed ? 'Excellent work! You have unlocked the next lesson in the curriculum.' : 'Don\'t worry! Review the answers below and try again.'}
            </p>
          </div>

          {/* Scores details */}
          <div className="flex justify-center gap-4 sm:gap-8 pt-2 sm:pt-4">
            <div className="text-center">
              <span className="block text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                {resultData.obtainedMarks} / {resultData.totalMarks}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Obtained Score</span>
            </div>
            <div className="text-center">
              <span className="block text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                {formatTime(resultData.timeTaken)}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Time Taken</span>
            </div>
            <div className="text-center">
              <span className="block text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                {resultData.attemptCount}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Attempts</span>
            </div>
          </div>
        </div>

        {/* Answer Review Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="border-b dark:border-slate-800 pb-2 sm:pb-3">
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
              Questions Review
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
              Select a question number from the left panel to review its details and comparative answers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
            {/* Left Column: Sidebar Question Switcher */}
            <div className="md:col-span-1 bg-white dark:bg-card-dark border border-orange-100/50 dark:border-slate-800/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
              <h4 className="font-extrabold text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Question Panel
              </h4>
              
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {questions.map((q: Question, idx: number) => {
                  const studentAnswer = resultData.answers?.find((a) => a.questionId === q._id);
                  const isCorrect = studentAnswer?.isCorrect;
                  const isActive = activeReviewIndex === idx;
                  
                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => setActiveReviewIndex(idx)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-brand-primary scale-105 shadow-md font-black'
                          : 'hover:scale-105'
                      } ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                          : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Progress Summary Mini-Badge */}
              <div className="border-t dark:border-slate-800 pt-3 sm:pt-4 flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {resultData.obtainedMarks} Correct
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  {questions.length - resultData.obtainedMarks} Incorrect
                </span>
              </div>
            </div>

            {/* Right Column: Detailed Question Card */}
            <div className="md:col-span-2 space-y-4">
              {(() => {
                const activeQuestion = questions[activeReviewIndex];
                if (!activeQuestion) return null;
                
                const studentAnswer = resultData.answers?.find((a) => a.questionId === activeQuestion._id);
                const isCorrect = studentAnswer?.isCorrect;
                const activeParsedCalc = activeQuestion.questionType === 'calculation' ? parseCalculationText(activeQuestion.questionText) : null;
                
                return (
                  <div className="ui-card p-4 sm:p-5 space-y-4 sm:space-y-5 border-l-4 border-l-brand-primary">
                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2.5 sm:pb-3">
                      <div>
                        <h4 className="font-extrabold text-[11px] sm:text-xs text-brand-primary">
                          Question {activeReviewIndex + 1} of {questions.length}
                        </h4>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 capitalize font-bold">
                          Type: {activeQuestion.questionType || 'Calculation'}
                        </span>
                      </div>
                      
                      <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455'
                      }`}>
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={10} /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle size={10} /> Incorrect
                          </>
                        )}
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-4">
                      {activeParsedCalc ? (
                        <div className="flex justify-center py-3 sm:py-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl sm:rounded-2xl border dark:border-slate-800/40">
                          {activeParsedCalc.isVertical ? (
                            <div className="inline-flex flex-col items-end font-mono text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white border-b-4 border-slate-700 dark:border-slate-300 pb-1.5 sm:pb-2 px-4 sm:px-6 min-w-28 sm:min-w-35">
                              {activeParsedCalc.items.map((item, idx) => (
                                <div key={idx} className="flex items-center w-full justify-between gap-4 sm:gap-6">
                                  <span className="text-lg sm:text-2xl text-slate-400 dark:text-slate-500 font-bold">{item.sign}</span>
                                  <span>{item.val}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full px-2 sm:px-4">
                              {activeParsedCalc.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-white dark:bg-card-dark border dark:border-slate-800/60 rounded-xl sm:rounded-2xl shadow-sm font-mono text-xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
                                  {item.sign && <span className="text-brand-primary dark:text-brand-secondary text-base sm:text-2xl font-bold">{item.sign}</span>}
                                  <span>{item.val}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                          {activeQuestion.questionText}
                        </p>
                      )}

                      {/* Graphic Attachment */}
                      {activeQuestion.questionImage && (
                        <div className="flex justify-center p-2 bg-slate-50 dark:bg-page-dark rounded-xl border dark:border-slate-800/60 w-28 h-28 sm:w-36 sm:h-36">
                          <img src={activeQuestion.questionImage} alt="Finger Position" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}

                      {/* Audio Attachment */}
                      {activeQuestion.questionType === 'audio' && activeQuestion.questionAudio && (
                        <div className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-page-dark/60 border dark:border-slate-800/40 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
                            {audioPlaying[activeQuestion._id] ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-0.5 h-3.5 w-6 justify-center">
                                  <span className="w-0.5 h-3 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
                                  <span className="w-0.5 h-4 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.4s' }} />
                                  <span className="w-0.5 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }} />
                                  <span className="w-0.5 h-3.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.7s' }} />
                                </div>
                                <span className="text-brand-primary font-bold dark:text-brand-secondary animate-pulse">Playing audio problem...</span>
                              </div>
                            ) : audioCountdown[activeQuestion._id] !== undefined ? (
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                                <span className="text-amber-500 font-bold dark:text-amber-450 animate-pulse">Get ready to listen...</span>
                              </div>
                            ) : (
                              <>
                                <Volume2 size={16} className="text-brand-primary" />
                                <span>Listen to the calculation problem:</span>
                              </>
                            )}
                          </div>
                          <audio
                            ref={(el) => { audioRefs.current[activeQuestion._id] = el; }}
                            src={activeQuestion.questionAudio}
                            onPlay={() => setAudioPlaying(prev => ({ ...prev, [activeQuestion._id]: true }))}
                            onPause={() => setAudioPlaying(prev => ({ ...prev, [activeQuestion._id]: false }))}
                            onEnded={() => setAudioPlaying(prev => ({ ...prev, [activeQuestion._id]: false }))}
                          />
                          <button
                            type="button"
                            disabled={audioCountdown[activeQuestion._id] !== undefined || audioPlaying[activeQuestion._id]}
                            onClick={() => playAudio(activeQuestion._id)}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 shadow-sm transition-all ${
                              audioCountdown[activeQuestion._id] !== undefined
                                ? 'bg-amber-500 text-white cursor-not-allowed animate-pulse'
                                : audioPlaying[activeQuestion._id]
                                ? 'bg-emerald-600 text-white cursor-not-allowed'
                                : 'bg-brand-primary hover:bg-brand-primary/90 cursor-pointer'
                            }`}
                          >
                            {audioCountdown[activeQuestion._id] !== undefined ? (
                              <>
                                <Clock size={10} className="animate-spin" />
                                <span>Starting...</span>
                              </>
                            ) : audioPlaying[activeQuestion._id] ? (
                              <>
                                <Volume2 size={10} className="animate-bounce" />
                                <span>Playing...</span>
                              </>
                            ) : (
                              <>
                                <Play size={10} className="fill-current" /> Play Audio
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Answer Comparison Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 border-t dark:border-slate-800 pt-3 sm:pt-4">
                      <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                        isCorrect
                          ? 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/5 dark:border-emerald-900/30'
                          : 'bg-rose-50/20 border-rose-100 dark:bg-rose-950/5 dark:border-rose-900/30'
                      }`}>
                        <span className="text-[9px] sm:text-[10px] uppercase font-black text-slate-400 block mb-0.5 sm:mb-1">
                          Your Answer
                        </span>
                        <span className={`text-base sm:text-xl font-black ${
                          isCorrect ? 'text-emerald-600 dark:text-emerald-455' : 'text-rose-600 dark:text-rose-455'
                        }`}>
                          {studentAnswer?.answer || '(No Answer)'}
                        </span>
                      </div>
                      
                      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-emerald-50/40 border-emerald-200/50 dark:bg-emerald-950/10 dark:border-emerald-900/40">
                        <span className="text-[9px] sm:text-[10px] uppercase font-black text-slate-400 block mb-0.5 sm:mb-1">
                          Correct Answer
                        </span>
                        <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-455">
                          {activeQuestion.correctAnswer}
                        </span>
                      </div>
                    </div>

                    {/* Inner navigation buttons */}
                    <div className="flex justify-between gap-2 sm:gap-4 pt-2.5 sm:pt-3 border-t dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveReviewIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeReviewIndex === 0}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 border dark:border-slate-800/40 bg-white dark:bg-card-dark text-slate-700 dark:text-slate-300 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft size={12} /> Previous Question
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReviewIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                        disabled={activeReviewIndex === questions.length - 1}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 border dark:border-slate-800/40 bg-white dark:bg-card-dark text-slate-700 dark:text-slate-300 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Next Question <ArrowRight size={12} />
                      </button>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
          {!passed && (
            <button
              onClick={handleStartExam}
              className="flex-1 py-2.5 sm:py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Re-attempt Exam
            </button>
          )}
          <Link
            to={`/lms/${courseId}`}
            className="flex-1 py-2.5 sm:py-3.5 border dark:border-slate-800/60 bg-white dark:bg-card-dark text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
          >
            Return to Classroom
          </Link>
        </div>

      </motion.div>
    );
  }

  // 2. EXAM ACTIVE PORTAL (Full Screen)
  if (examStarted && currentQuestion) {
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / totalQuestions) * 100;

    return (
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-page-dark flex flex-col justify-between overflow-y-auto transition-colors duration-200">
        {/* Full Screen Countdown Overlay */}
        {audioCountdown[currentQuestion._id] !== undefined && (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md transition-all duration-300">
            <div className="text-center space-y-6">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-primary dark:text-brand-secondary animate-pulse">
                Audio Question Starting In
              </div>
              <motion.div
                key={audioCountdown[currentQuestion._id]}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-9xl font-black text-white font-display select-none filter drop-shadow-[0_0_20px_rgba(232,100,36,0.3)]"
              >
                {audioCountdown[currentQuestion._id]}
              </motion.div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs px-6 leading-relaxed">
                Get ready to listen carefully. The audio will play shortly.
              </div>
            </div>
          </div>
        )}
        
        {/* Header: Title, progress, timer */}
        <header className="sticky top-0 bg-white dark:bg-card-dark border-b dark:border-slate-800/60 p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h2 className="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-50 sm:max-w-xs">
                {exam.title}
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Active Assessment
              </span>
            </div>
          </div>

          {/* Time Countdown */}
          {timeRemaining !== null && (
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl border font-mono font-bold text-sm sm:text-base ${
              timeRemaining < 60 
                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse dark:bg-rose-950/20 dark:border-rose-900' 
                : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary dark:bg-brand-primary/20 dark:border-brand-primary/40'
            }`}>
              <Clock size={16} />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </header>

        {/* Middle Area: Question Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            key={currentQuestionIndex}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ui-card p-6 sm:p-8 max-w-xl w-full space-y-6"
          >
            {/* Question Counter */}
            <div className="flex justify-between items-center border-b dark:border-slate-700 pb-4">
              <span className="text-xs font-bold text-brand-primary dark:text-brand-secondary">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-page-dark text-slate-500 px-2 py-1 rounded-md">
                {currentQuestion.questionType || 'Calculation'}
              </span>
            </div>

            {/* Question Text / Styled Calculation */}
            {parsedCalc ? (
              <div className="flex justify-center py-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border dark:border-slate-800/40">
                {parsedCalc.isVertical ? (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08 }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    key={`${currentQuestionIndex}-vertical`}
                    className="inline-flex flex-col items-end font-mono text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white border-b-4 border-slate-700 dark:border-slate-300 pb-2 px-6 min-w-35"
                  >
                    {parsedCalc.items.map((item, idx) => {
                      return (
                        <motion.div 
                          key={idx} 
                          variants={{
                            hidden: { opacity: 0, x: -15 },
                            show: { opacity: 1, x: 0 }
                          }}
                          className="flex items-center w-full justify-between gap-6"
                        >
                          <span className="text-2xl text-slate-400 dark:text-slate-500 select-none font-bold">
                            {item.sign}
                          </span>
                          <span>{item.val}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08 }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    key={`${currentQuestionIndex}-horizontal`}
                    className="flex flex-wrap items-center justify-center gap-3 max-w-full px-4"
                  >
                    {parsedCalc.items.map((item, idx) => {
                      return (
                        <motion.div 
                          key={idx} 
                          variants={{
                            hidden: { opacity: 0, scale: 0.8 },
                            show: { opacity: 1, scale: 1 }
                          }}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-card-dark border dark:border-slate-800/60 rounded-2xl shadow-sm font-mono text-3xl font-extrabold text-slate-800 dark:text-white"
                        >
                          {item.sign && (
                            <span className="text-brand-primary dark:text-brand-secondary text-2xl font-bold select-none">
                              {item.sign}
                            </span>
                          )}
                          <span>{item.val}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            ) : (
              <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.questionText}
              </h3>
            )}

            {/* Layout based on Question Type */}
            <div className="space-y-4">
              {/* IMAGE TYPE */}
              {currentQuestion.questionType === 'image' && currentQuestion.questionImage && (
                <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-50 border dark:border-slate-700 flex items-center justify-center p-4">
                  <img
                    src={currentQuestion.questionImage}
                    alt="Question Graphic"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              {/* AUDIO TYPE */}
              {currentQuestion.questionType === 'audio' && currentQuestion.questionAudio && (
                <div className="w-full p-4 bg-slate-50 dark:bg-page-dark/60 border dark:border-slate-800/40 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    {audioPlaying[currentQuestion._id] ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 h-3.5 w-6 justify-center">
                          <span className="w-0.5 h-3 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
                          <span className="w-0.5 h-4 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.4s' }} />
                          <span className="w-0.5 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.5s' }} />
                          <span className="w-0.5 h-3.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.7s' }} />
                        </div>
                        <span className="text-brand-primary font-bold dark:text-brand-secondary animate-pulse">Playing audio problem...</span>
                      </div>
                    ) : audioCountdown[currentQuestion._id] !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                        <span className="text-amber-500 font-bold dark:text-amber-450 animate-pulse">Get ready to listen...</span>
                      </div>
                    ) : (
                      <>
                        <Volume2 size={20} className="text-brand-primary" />
                        <span>Listen to the calculation problem:</span>
                      </>
                    )}
                  </div>
                  
                  {/* HTML5 audio element hidden */}
                  <audio
                    ref={(el) => { audioRefs.current[currentQuestion._id] = el; }}
                    src={currentQuestion.questionAudio}
                    onPlay={() => setAudioPlaying(prev => ({ ...prev, [currentQuestion._id]: true }))}
                    onPause={() => setAudioPlaying(prev => ({ ...prev, [currentQuestion._id]: false }))}
                    onEnded={() => setAudioPlaying(prev => ({ ...prev, [currentQuestion._id]: false }))}
                  />

                  <button
                    disabled={audioCountdown[currentQuestion._id] !== undefined || audioPlaying[currentQuestion._id]}
                    onClick={() => playAudio(currentQuestion._id)}
                    className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                      audioCountdown[currentQuestion._id] !== undefined
                        ? 'bg-amber-500 text-white cursor-not-allowed animate-pulse'
                        : audioPlaying[currentQuestion._id]
                        ? 'bg-emerald-600 text-white cursor-not-allowed'
                        : 'bg-brand-primary hover:bg-brand-primary/90 cursor-pointer'
                    }`}
                  >
                    {audioCountdown[currentQuestion._id] !== undefined ? (
                      <>
                        <Clock size={12} className="animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : audioPlaying[currentQuestion._id] ? (
                      <>
                        <Volume2 size={12} className="animate-bounce" />
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-current" /> Play Audio
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Answer Input layout (Calculation / Text / Audio / Image) */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Your Answer
                </label>
                <input
                  type={currentQuestion.questionType === 'calculation' ? 'number' : 'text'}
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  placeholder={currentQuestion.questionType === 'calculation' ? 'Enter numerical answer' : 'Enter answer here...'}
                  className="w-full px-4 py-3 border dark:border-slate-800/40 bg-slate-50 dark:bg-page-dark text-slate-800 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-semibold"
                  autoFocus
                />
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700 gap-4">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex-1 py-3 border dark:border-slate-800/40 bg-white dark:bg-card-dark text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} /> Previous
              </button>
              
              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1"
                >
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleExamSubmit()}
                  disabled={submitExamMutation.isPending}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={14} /> {submitExamMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </motion.div>
        </main>

        {/* Footer: Progress Indicator */}
        <footer className="sticky bottom-0 bg-white dark:bg-card-dark border-t dark:border-slate-800/40 p-4 z-10 space-y-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
            <span>Answers Saved: {answeredCount} / {totalQuestions}</span>
            <span>{Math.round(progressPercent)}% Filled</span>
          </div>
          <div className="max-w-4xl mx-auto w-full bg-slate-100 dark:bg-page-dark h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </footer>

      </div>
    );
  }

  // 3. EXAM LANDING PAGE (Intro/Instructions)
  return (
    <motion.div
      variants={pageChildVariants}
      initial="initial"
      animate="animate"
      className="max-w-md w-full mx-auto px-4 py-16"
    >
      <div className="ui-card p-8 text-center space-y-6">
        
        {/* Intro Icon */}
        <div className="w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-3xl flex items-center justify-center text-brand-primary dark:text-brand-secondary text-3xl mx-auto">
          ⏳
        </div>

        {/* Assessment Intro details */}
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
            {exam.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {exam.description || 'Welcome to the Lesson Assessment exam. Please review the criteria below before starting.'}
          </p>
        </div>

        {/* Guidelines panel */}
        <div className="p-4 bg-slate-50 dark:bg-page-dark/60 rounded-2xl border dark:border-slate-800/40 text-xs text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Marks:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{exam.totalMarks} Marks</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Passing Threshold:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{exam.passingMarks} Marks</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Assessment Time:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {exam.timeLimit} minutes
            </span>
          </div>
          <div className="flex items-start gap-1.5 border-t dark:border-slate-700 pt-3 text-rose-500/80">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Refreshing, closing tabs, or backing out once started will discard your attempt score.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStartExam}
          className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all flex items-center justify-center gap-2"
        >
          <span>Start Assessment Now</span>
          <ChevronRight size={16} />
        </button>

        <Link
          to={`/lms/${courseId}`}
          className="block text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          Go Back to Classroom
        </Link>

      </div>
    </motion.div>
  );
};
