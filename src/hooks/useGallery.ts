import { useQuery, keepPreviousData } from '@tanstack/react-query';
import galleryService from '../services/gallery.service';
import type { GalleryListParams } from '../services/gallery.service';

export const useGallery = (params?: GalleryListParams) => {
  return useQuery({
    queryKey: ['gallery', params],
    queryFn: () => galleryService.getAllGallery(params),
    placeholderData: keepPreviousData,
  });
};

export const useGalleryItem = (id: string) => {
  return useQuery({
    queryKey: ['gallery', id],
    queryFn: () => galleryService.getGalleryById(id),
    enabled: !!id,
  });
};
