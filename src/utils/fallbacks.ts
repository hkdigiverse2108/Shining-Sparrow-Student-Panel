import React from 'react';

// Premium high-quality images from Unsplash for fallbacks
export const FALLBACK_COURSE_IMAGE = 'https://images.unsplash.com/photo-1596495578065-6e076b8df1d8?q=80&w=600';
export const FALLBACK_WORKSHOP_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600';

export const getAvatarFallback = (name: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
};

/**
 * Handles image load errors gracefully, substituting a fallback image
 * and preventing infinite error loops if the fallback also fails.
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string
) => {
  const target = e.currentTarget;
  if (target.src === fallbackUrl) {
    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e86424' opacity='0.1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23e86424' font-weight='bold'%3EShining Sparrow%3C/text%3E%3C/svg%3E";
  } else {
    target.src = fallbackUrl;
  }
};
