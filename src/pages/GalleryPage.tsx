import React, { useState } from 'react';
import { useGallery } from '../hooks/useGallery';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, Image as ImageIcon, Search, ChevronLeft, ChevronRight,
  X, ZoomIn, Calendar, ArrowLeft, Download, Maximize2, FolderOpen
} from 'lucide-react';
import { getImageUrl } from '../utils/fallbacks';

interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  createdAt: string;
}

export const GalleryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Fetch all gallery items
  const { data: galleryRes, isLoading } = useGallery({
    search: searchQuery,
    hasImages: 'true'
  });

  const galleryData: GalleryItem[] = galleryRes?.data?.gallery_data || [];

  const handleOpenAlbum = (album: GalleryItem) => {
    setSelectedAlbum(album);
    setActiveImageIndex(null);
  };

  const handleCloseAlbum = () => {
    setSelectedAlbum(null);
    setActiveImageIndex(null);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedAlbum && activeImageIndex !== null) {
      setActiveImageIndex((prev) => 
        prev !== null && prev < selectedAlbum.images.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedAlbum && activeImageIndex !== null) {
      setActiveImageIndex((prev) => 
        prev !== null && prev > 0 ? prev - 1 : selectedAlbum.images.length - 1
      );
    }
  };

  // Keyboard navigation for Lightbox
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null) return;
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setActiveImageIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, selectedAlbum]);

  return (
    <div className="relative w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 space-y-8 overflow-x-hidden">
      
      {/* Ambient background blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-125 h-125 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-150 h-150 rounded-full bg-orange-600/5 blur-[150px] pointer-events-none" />

      {/* Header section (full width) */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
            <FolderOpen className="w-3.5 h-3.5" />
            Media Storage
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Campus Archives & Albums
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
            Explore our memories, workshops, hackathons, and corporate celebrations stored inside classified archive folders.
          </p>
        </div>

        {/* Full-width Search Bar */}
        {!selectedAlbum && (
          <div className="relative w-full md:w-96 group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 text-slate-805 dark:text-slate-100 transition-all text-sm shadow-sm"
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedAlbum ? (
          /* ================= ALBUM CONTENT VIEW (Full width) ================= */
          <motion.div
            key="album-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Back CTA */}
            <button
              onClick={handleCloseAlbum}
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-sm bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Archives
            </button>

            {/* Folder Header Deck */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-wrap gap-2 text-xs font-extrabold uppercase text-amber-600 dark:text-amber-500">
                <span className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedAlbum.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {selectedAlbum.images.length} files
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Folder: {selectedAlbum.title}
              </h2>
              {selectedAlbum.description && (
                <p className="text-slate-650 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-6xl">
                  {selectedAlbum.description}
                </p>
              )}
            </div>

            {/* Photo Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {selectedAlbum.images.map((image, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => setActiveImageIndex(idx)}
                  className="relative aspect-square bg-slate-200 dark:bg-slate-900 rounded-2xl overflow-hidden cursor-zoom-in group border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${selectedAlbum.title} - ${idx + 1}`}
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="text-white w-8 h-8" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ================= FOLDER SURFING DIRECTORY VIEW ================= */
          <motion.div
            key="folders-directory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl h-44 animate-pulse" />
                ))}
              </div>
            ) : galleryData.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg mx-auto">
                <Folder className="w-16 h-16 mx-auto text-slate-350 dark:text-slate-650" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4">
                  Directory Empty
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  No matching archived folders were found in this directory.
                </p>
              </div>
            ) : (
              /* Actual Folder shaped components grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 sm:gap-10">
                {galleryData.map((album) => (
                  <motion.div
                    key={album._id}
                    onClick={() => handleOpenAlbum(album)}
                    className="relative group cursor-pointer flex flex-col items-center select-none"
                  >
                    
                    {/* The Physical Folder Body Wrapper */}
                    <div className="relative w-full aspect-[4/3] max-w-[200px] mb-3">
                      
                      {/* 1. Back Cover of the Folder */}
                      <div className="absolute inset-0 bg-amber-600/90 dark:bg-amber-700 rounded-xl shadow-md border-b-4 border-amber-700/80" />

                      {/* 2. Folder Tab (top-left tab) */}
                      <div className="absolute -top-3.5 left-2 w-14 h-4 bg-amber-600 dark:bg-amber-700 rounded-t-lg" />
                      
                      {/* 3. Peeking Photo / File Sheets (Slide upward on hover) */}
                      {album.images && album.images.length > 0 && (
                        <>
                          {/* Second sheet (rotated) */}
                          <div className="absolute inset-x-3.5 top-0 bottom-4 bg-slate-200 dark:bg-slate-800 rounded shadow-sm border border-slate-300 dark:border-slate-750 rotate-3 transform transition-transform group-hover:-translate-y-6 group-hover:rotate-6 duration-300 origin-bottom" />
                          
                          {/* Main sheet showing photo preview */}
                          <div className="absolute inset-x-3.5 top-0 bottom-4 bg-white dark:bg-slate-850 rounded p-1 shadow-md -rotate-3 transform transition-transform group-hover:-translate-y-9 group-hover:-rotate-6 duration-300 origin-bottom">
                            <img 
                              src={getImageUrl(album.images[0])} 
                              alt="preview" 
                              className="w-full h-full object-cover rounded-sm"
                            />
                          </div>
                        </>
                      )}

                      {/* 4. Front Cover of the Folder (Lower height than back cover, rounded right corner) */}
                      <div className="absolute inset-x-0 bottom-0 top-3 bg-amber-500 dark:bg-amber-600 rounded-b-xl rounded-tr-xl shadow-inner border-t border-amber-400 flex flex-col justify-end p-2 sm:p-3 transform group-hover:rotate-x-6 duration-300 origin-bottom">
                        {/* Folder Line Art or Badge */}
                        <div className="flex justify-between items-center text-amber-900/60 dark:text-amber-950/60">
                          <span className="text-[10px] font-extrabold uppercase tracking-wide bg-amber-600/20 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                            {album.images ? album.images.length : 0} IMG
                          </span>
                          <FolderOpen className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Folder Label / Name */}
                    <div className="text-center w-full px-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {album.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(album.createdAt).toLocaleDateString(undefined, { year: '2-digit', month: 'short' })}
                      </p>
                    </div>

                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= FULLSCREEN LIGHTBOX CAROUSEL ================= */}
      <AnimatePresence>
        {selectedAlbum && activeImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImageIndex(null)}
            className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-md flex flex-col justify-between p-4"
          >
            {/* Lightbox Toolbar */}
            <div className="flex justify-between items-center text-white/95 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{selectedAlbum.title}</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-semibold">
                  {activeImageIndex + 1} / {selectedAlbum.images.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedAlbum.images[activeImageIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                  title="Open Original"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setActiveImageIndex(null)}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Viewer Stage */}
            <div className="relative flex-grow flex items-center justify-center px-4">
              <button
                onClick={handlePrevImage}
                className="absolute left-6 z-10 p-3 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white rounded-full transition-all border border-white/10 backdrop-blur-md"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <motion.div
                key={activeImageIndex}
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={getImageUrl(selectedAlbum.images[activeImageIndex])}
                  alt={`${selectedAlbum.title} - ${activeImageIndex + 1}`}
                  className="max-h-[75vh] max-w-full object-contain select-none"
                />
              </motion.div>

              <button
                onClick={handleNextImage}
                className="absolute right-6 z-10 p-3 bg-white/5 hover:bg-white/15 text-white/80 hover:text-white rounded-full transition-all border border-white/10 backdrop-blur-md"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Carousel strip */}
            <div className="w-full max-w-4xl mx-auto px-4 pb-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2.5 justify-center overflow-x-auto py-3 no-scrollbar scroll-smooth">
                {selectedAlbum.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      i === activeImageIndex 
                        ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/20' 
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="text-center text-white/40 text-xs mt-2">
                Use <kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd> arrow keys to navigate. Click outside to exit.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
