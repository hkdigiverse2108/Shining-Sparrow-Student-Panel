import React from 'react';

export const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-75">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-orange-100 rounded-full dark:border-orange-950"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-primary rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="ui-card relative overflow-hidden space-y-5">
      <style>{`
        @keyframes premium-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .premium-shimmer-bg {
          background: linear-gradient(90deg, 
            rgba(241,245,249,0.8) 25%, 
            rgba(232,100,36,0.08) 37%, 
            rgba(241,245,249,0.8) 50%
          );
          background-size: 200% 100%;
          animation: premium-shimmer 1.8s infinite linear;
        }
        .dark .premium-shimmer-bg {
          background: linear-gradient(90deg, 
            rgba(30,41,59,0.6) 25%, 
            rgba(232,100,36,0.18) 37%, 
            rgba(30,41,59,0.6) 50%
          );
          background-size: 200% 100%;
          animation: premium-shimmer 1.8s infinite linear;
        }
      `}</style>
      
      {/* Image Skeleton */}
      <div className="w-full h-36 rounded-2xl premium-shimmer-bg"></div>
      
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-5 rounded-md w-3/4 premium-shimmer-bg"></div>
        <div className="h-3.5 rounded-md w-1/2 premium-shimmer-bg"></div>
      </div>
      
      {/* Progress or stats line skeleton */}
      <div className="space-y-1.5 pt-2">
        <div className="h-3 rounded-md w-1/3 premium-shimmer-bg"></div>
        <div className="h-2.5 rounded-md w-full premium-shimmer-bg"></div>
      </div>
      
      {/* Button Skeleton */}
      <div className="pt-3 border-t border-orange-50/40 dark:border-slate-800/60 flex justify-between items-center gap-4">
        <div className="h-4 rounded-md w-1/4 premium-shimmer-bg"></div>
        <div className="h-8 rounded-xl w-1/3 premium-shimmer-bg"></div>
      </div>
    </div>
  );
};

export const LessonSkeleton = () => {
  return (
    <div className="flex gap-4 p-4 border-b dark:border-slate-800/40 items-center">
      <style>{`
        @keyframes premium-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .premium-shimmer-bg {
          background: linear-gradient(90deg, 
            rgba(241,245,249,0.8) 25%, 
            rgba(232,100,36,0.08) 37%, 
            rgba(241,245,249,0.8) 50%
          );
          background-size: 200% 100%;
          animation: premium-shimmer 1.8s infinite linear;
        }
        .dark .premium-shimmer-bg {
          background: linear-gradient(90deg, 
            rgba(30,41,59,0.6) 25%, 
            rgba(232,100,36,0.18) 37%, 
            rgba(30,41,59,0.6) 50%
          );
          background-size: 200% 100%;
          animation: premium-shimmer 1.8s infinite linear;
        }
      `}</style>
      <div className="w-10 h-10 rounded-xl premium-shimmer-bg shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded-md w-2/3 premium-shimmer-bg"></div>
        <div className="h-3 rounded-md w-1/3 premium-shimmer-bg"></div>
      </div>
    </div>
  );
};
