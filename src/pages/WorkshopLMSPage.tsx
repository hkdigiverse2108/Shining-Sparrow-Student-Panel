import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkshop } from '../hooks/useWorkshops';
import { useWorkshopCurriculums, useCompleteWorkshopCurriculum, useWorkshopProgress } from '../hooks/useLMS';
import { Loader } from '../components/Loader';
import { Play, Download, FileText, ArrowLeft, Video, Maximize2, Minimize2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageChildVariants } from '../components/PageTransition';

// Helper to format attachment URLs (handles relative backend paths, missing protocols, Google Drive URLs)
const formatAttachmentUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  let trimmed = url.trim();
  
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }
  
  if (trimmed.startsWith('drive.google.com') || trimmed.startsWith('docs.google.com') || trimmed.startsWith('dropbox.com')) {
    return `https://${trimmed}`;
  }
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5666').replace(/\/$/, '');
  const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${relativePath}`;
};

// Helper for PDF embedding / viewing
const getEmbeddablePdfUrl = (url: string): { isFolder: boolean; embedUrl: string } => {
  if (!url) return { isFolder: false, embedUrl: '' };
  
  if (url.includes('drive.google.com/drive/folders/')) {
    return { isFolder: true, embedUrl: url };
  }
  
  if (url.includes('drive.google.com/file/d/')) {
    const embedUrl = url.replace(/\/view(\?.*)?$/, '/preview');
    return { isFolder: false, embedUrl };
  }

  if (url.startsWith('data:')) {
    try {
      const parts = url.split(";base64,");
      const contentType = parts[0].replace("data:", "") || "application/pdf";
      const raw = window.atob(parts[1] || parts[0]);
      const uInt8Array = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      return { isFolder: false, embedUrl: URL.createObjectURL(blob) };
    } catch {
      return { isFolder: false, embedUrl: url };
    }
  }
  
  return { isFolder: false, embedUrl: url.includes('#') ? url : `${url}#toolbar=0&navpanes=0&scrollbar=0` };
};

// Helper to handle safe download / open without triggering about:blank#blocked on data URLs
const handleDownloadAttachment = (url: string | null | undefined, filename = "attachment.pdf") => {
  if (!url) return;
  const formattedUrl = formatAttachmentUrl(url);

  if (formattedUrl.startsWith("data:")) {
    try {
      const parts = formattedUrl.split(";base64,");
      const contentType = parts[0].replace("data:", "") || "application/pdf";
      const base64Data = parts[1] || parts[0];
      const raw = window.atob(base64Data);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (e) {
      console.error("Failed to download data URL:", e);
      const link = document.createElement("a");
      link.href = formattedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } else {
    window.open(formattedUrl, "_blank", "noopener,noreferrer");
  }
};

// Detect the type of link: 'youtube' | 'external-live' | 'vimeo' | 'twitch' | 'direct-video'
const getLinkType = (url: string | null): 'youtube' | 'external-live' | 'vimeo' | 'twitch' | 'direct-video' => {
  if (!url) return 'direct-video';
  const u = url.toLowerCase();
  
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return 'youtube';
  }
  if (
    u.includes('zoom.us') || 
    u.includes('zoom.com') || 
    u.includes('meet.google.com') || 
    u.includes('teams.microsoft.com') || 
    u.includes('teams.live.com') || 
    u.includes('webex.com') ||
    u.includes('discord.gg') ||
    u.includes('discord.com') ||
    u.includes('meet.jit.si')
  ) {
    return 'external-live';
  }
  if (u.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (u.includes('twitch.tv')) {
    return 'twitch';
  }
  
  return 'direct-video';
};

// Helper to parse video/livestream URLs to embed URLs
const getEmbedUrl = (url: string) => {
  if (!url) return '';
  
  let embedUrl = url;
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    if (url.includes('youtube.com/embed/')) {
      const separator = url.includes('?') ? '&' : '?';
      if (!url.includes('controls=')) {
        return `${url}${separator}autoplay=1&controls=2&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=0`;
      }
      return url;
    }
    
    let videoId = '';
    
    // Check for youtube.com/live/VIDEO_ID
    if (url.includes('youtube.com/live/')) {
      const parts = url.split('youtube.com/live/');
      if (parts.length > 1) {
        videoId = parts[1].split(/[?#]/)[0];
      }
    } else {
      // Standard youtube regexp
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
    }
    
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=2&modestbranding=1&rel=0&iv_load_policy=3&fs=0&playsinline=1&disablekb=0`;
    }
  } else if (url.includes('vimeo.com')) {
    // Vimeo parser
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    if (match && match[3]) {
      embedUrl = `https://player.vimeo.com/video/${match[3]}?autoplay=1`;
    }
  } else if (url.includes('twitch.tv')) {
    // Twitch parser
    const parts = url.split('twitch.tv/');
    if (parts.length > 1) {
      const channel = parts[1].split(/[?#]/)[0];
      embedUrl = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true`;
    }
  }
  
  return embedUrl;
};

interface WorkshopCurriculum {
  _id: string;
  title: string;
  videoLink: string;
  description: string;
  attachment?: string;
  duration?: string;
  date?: string;
  isCompleted?: boolean;
}

export const WorkshopLMSPage = () => {
  const { workshopId } = useParams<{ workshopId: string }>();

  // Fullscreen logic
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Queries
  const { data: workshopRes, isLoading: workshopLoading } = useWorkshop(workshopId || '');
  const workshop = workshopRes?.data;

  const { data: curriculumsRes, isLoading: curriculumsLoading, error: curriculumsError } = useWorkshopCurriculums(workshopId || '');
  const rawCurriculums = curriculumsRes?.data?.workshop_curriculum_data;
  const curriculums = React.useMemo(() => rawCurriculums || [], [rawCurriculums]) as WorkshopCurriculum[];

  const { data: progressRes } = useWorkshopProgress(workshopId || '');
  const progress = progressRes?.data;
  const completedCount = progress?.completedCount || 0;
  const totalCount = progress?.totalCount || curriculums.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const completeMutation = useCompleteWorkshopCurriculum();

  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  // Active Video State
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string | null>(null);
  const [activeVideoDesc, setActiveVideoDesc] = useState<string | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<string | null>(null);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);

  // Compute active video details with first curriculum as fallback
  const currentVideoUrl = activeVideoUrl ?? (curriculums.length > 0 ? curriculums[0].videoLink : null);
  const currentVideoTitle = activeVideoTitle ?? (curriculums.length > 0 ? curriculums[0].title : null);
  const currentVideoDesc = activeVideoDesc ?? (curriculums.length > 0 ? curriculums[0].description : null);
  const currentAttachment = activeAttachment ?? (curriculums.length > 0 ? curriculums[0].attachment : null);
  const currentCurriculumId = activeCurriculumId ?? (curriculums.length > 0 ? curriculums[0]._id : null);
  const currentIsCompleted = curriculums.find(c => c._id === currentCurriculumId)?.isCompleted || false;

  if (workshopLoading || curriculumsLoading) {
    return <Loader />;
  }

  if (curriculumsError) {
    const errorMsg = (curriculumsError as any)?.response?.data?.message || (curriculumsError as any)?.message || '';
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg">
          🔒
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            ⚠️ Access Suspended
          </span>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white pt-1">
            Access Suspended Due to Pending Payment
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            {errorMsg || 'Your access to this workshop has been suspended due to pending payment. Please complete your payment or contact support to unlock your access.'}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/support" className="ui-button-primary px-6 py-3 text-xs">
            Contact Support Team
          </Link>
          <Link to="/dashboard" className="ui-button-outline px-6 py-3 text-xs">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Workshop not found</h2>
        <p className="text-slate-500 mt-2">Could not retrieve workshop contents.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageChildVariants}
      initial="initial"
      animate="animate"
      className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      
      {/* Back button and workshop title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white leading-tight">
              {workshop.title}
            </h1>
            <p className="text-xs text-brand-primary dark:text-brand-secondary font-semibold mt-0.5">
              {workshop.subTitle || 'Chronological Lecture Stream'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary dark:text-brand-secondary self-start sm:self-auto">
          🎥 Linear Access
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Player & Current Details */}
        <div className="lg:col-span-3 space-y-6">
          {currentVideoUrl ? (
            <div className="space-y-6">
              {/* Video Player */}
              <div 
                ref={playerContainerRef}
                className="group relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-900 border dark:border-slate-800 shadow-lg"
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => {
                  if (iframeRef.current) iframeRef.current.focus();
                }}
              >
                {getLinkType(currentVideoUrl) === 'external-live' ? (
                  <div className="absolute inset-0 bg-linear-to-br from-card-dark to-slate-950 dark:from-page-dark dark:to-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                    {/* Animated background decoration */}
                    <div className="absolute w-96 h-96 rounded-full bg-brand-primary/15 blur-3xl pointer-events-none animate-pulse-amber" />
                    
                    <div className="relative z-10 max-w-md space-y-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-red-400">🔴 Live Interactive Class</span>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-display font-extrabold text-lg sm:text-2xl leading-snug text-white dark:text-white">
                          Live Interactive Lecture
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-300 dark:text-slate-400 leading-normal max-w-xs mx-auto">
                          This workshop session is currently broadcasting live. Click the button below to join the virtual lecture.
                        </p>
                      </div>

                      <div className="pt-1">
                        <a
                          href={currentVideoUrl || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-primary/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                        >
                          <span>Join Live Lecture Now</span>
                          <Play size={12} className="fill-current animate-pulse" />
                        </a>
                      </div>
                      
                      <span className="block text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">
                        Stream Host: {currentVideoUrl?.includes('meet.google') ? 'Google Meet' : currentVideoUrl?.includes('zoom') ? 'Zoom' : 'External Live Platform'}
                      </span>
                    </div>
                  </div>
                ) : getLinkType(currentVideoUrl) === 'youtube' || getLinkType(currentVideoUrl) === 'vimeo' || getLinkType(currentVideoUrl) === 'twitch' ? (
                  <>
                    <iframe
                      ref={iframeRef}
                      src={getEmbedUrl(currentVideoUrl || '')}
                      title={currentVideoTitle || 'Workshop video'}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    
                    {/* Top bar visual shield + branding */}
                    <div 
                      key={currentVideoUrl || 'topbar'}
                      className="absolute top-0 left-0 right-0 h-14 bg-linear-to-b from-slate-950/90 to-slate-950/20 backdrop-blur-[2px] z-10 flex items-center px-6 pointer-events-none select-none animate-top-bar-fade group-hover:opacity-100! group-hover:backdrop-blur-[2px]! transition-all duration-500"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse"></span>
                        <span className="text-sm font-bold text-white tracking-wide truncate max-w-70 sm:max-w-md">
                          {currentVideoTitle || 'Workshop Video'}
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
                    src={currentVideoUrl || undefined}
                    controls
                    className="absolute inset-0 w-full h-full"
                  ></video>
                )}
              </div>

              {/* Lecture details */}
              <div className="space-y-4">
                <div>
                  <h2 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                    {currentVideoTitle}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    {currentVideoDesc}
                  </p>
                </div>

                {/* Attachment Section if exists */}
                {currentAttachment && (
                  <div className="ui-card p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-primary/20 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-secondary rounded-xl">
                        <FileText size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Workshop Materials & PDF</span>
                        <span className="block text-[10px] text-slate-400">View or download session worksheets & study notes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const formatted = formatAttachmentUrl(currentAttachment);
                          const { isFolder } = getEmbeddablePdfUrl(formatted);
                          if (isFolder) {
                            window.open(formatted, '_blank');
                          } else {
                            setPdfViewerUrl(formatted);
                          }
                        }}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-brand-primary dark:text-brand-secondary hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm cursor-pointer"
                        title="View PDF / Attachment"
                      >
                        <Maximize2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(currentAttachment)}
                        className="ui-button-outline p-2 cursor-pointer"
                        title="Open / Download Link"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Mark as Completed Button */}
                {currentCurriculumId && (
                  <div className="flex items-center justify-between">
                    {currentIsCompleted ? (
                      <span className="flex items-center gap-2 text-sm font-bold text-emerald-500">
                        <CheckCircle2 size={18} /> Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (workshopId && currentCurriculumId) {
                            completeMutation.mutate({
                              workshopId,
                              workshopCurriculumId: currentCurriculumId,
                            });
                          }
                        }}
                        disabled={completeMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-brand-primary/10 active:scale-[0.97] disabled:opacity-75"
                      >
                        {completeMutation.isPending ? (
                          <>
                            <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                            Marking...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            Mark as Completed
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-center border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="space-y-3.5 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-sm">
                  <Video size={28} />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    ✓ Enrollment Confirmed & Active
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white pt-1">
                    No Video Lectures Uploaded Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    The admin/instructor has not uploaded video lectures for this workshop yet. Once the admin adds curriculum videos in Admin Panel, they will appear here automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Workshop Curriculum List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
              Workshop Lectures ({curriculums.length})
            </h3>
            {totalCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>Progress</span>
                  <span className="text-brand-secondary">{completedCount}/{totalCount}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-primary to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {curriculums.length > 0 ? (
              curriculums.map((curr: WorkshopCurriculum, index: number) => {
                const isActive = currentVideoUrl === curr.videoLink;
                return (
                  <motion.button
                    key={curr._id || index}
                    onClick={() => {
                      setActiveVideoUrl(curr.videoLink);
                      setActiveVideoTitle(curr.title);
                      setActiveVideoDesc(curr.description);
                      setActiveAttachment(curr.attachment || null);
                      setActiveCurriculumId(curr._id);
                    }}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary dark:bg-brand-primary/20 dark:border-brand-primary/45 dark:text-brand-secondary'
                        : 'bg-white dark:bg-card-dark border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${curr.isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-brand-primary text-white' : 'bg-slate-100 dark:bg-slate-900'}`}>
                      {curr.isCompleted ? <CheckCircle2 size={14} /> : <Play size={14} className="fill-current" />}
                    </div>
                    
                    <div className="min-w-0 space-y-1">
                      <span className="block text-xs font-extrabold line-clamp-1">
                        Part {index + 1}: {curr.title}
                      </span>
                      <span className="block text-[10px] text-slate-400 line-clamp-1">
                        {curr.duration || 'Flexible duration'} {curr.date ? `• ${new Date(curr.date).toLocaleDateString()}` : ''}
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {curr.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <div className="ui-card border border-dashed border-slate-300 dark:border-slate-800 text-center py-8 px-4 space-y-1 rounded-2xl">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Lectures Listed Yet</p>
                <p className="text-[10px] text-slate-400">Curriculum is being prepared by the instructor.</p>
              </div>
            )}
          </div>
        </div>

      </div>

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
                    <h3 className="text-sm font-bold text-white leading-tight">Workshop Attachment PDF</h3>
                    <p className="text-[10px] text-slate-400">View session material document</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadAttachment(pdfViewerUrl)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                    title="Open / Download Document"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => setPdfViewerUrl(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Secure PDF iFrame Container */}
              <div className="grow bg-slate-950 p-2 relative flex items-center justify-center">
                <iframe
                  src={getEmbeddablePdfUrl(pdfViewerUrl).embedUrl}
                  title="PDF Document"
                  className="w-full h-full rounded-2xl border-0 bg-slate-900 z-0"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
