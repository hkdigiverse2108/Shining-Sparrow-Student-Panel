import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import settingsService from '../services/settings.service';
import authService from '../services/auth.service';
import type { ContactUsPayload } from '../services/settings.service';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });
};

export const useContactUsInfo = () => {
  return useQuery({
    queryKey: ['contact-us'],
    queryFn: () => settingsService.getContactUs(),
  });
};

export const useHeroBanners = (params?: { page?: number; limit?: number; type?: string }) => {
  return useQuery({
    queryKey: ['hero-banners', params],
    queryFn: () => settingsService.getHeroBanners(params),
  });
};

export const useTestimonials = (params?: { page?: number; limit?: number; type?: string }) => {
  return useQuery({
    queryKey: ['testimonials', params],
    queryFn: () => settingsService.getTestimonials(params),
  });
};

export const useFAQs = (params?: { page?: number; limit?: number; search?: string; type?: string; learningCatalogFilter?: string }) => {
  return useQuery({
    queryKey: ['faqs', params],
    queryFn: () => settingsService.getFAQs(params),
  });
};

export const useContactUs = () => {
  return useMutation({
    mutationFn: (payload: ContactUsPayload) => settingsService.contactUs(payload),
  });
};

export const useSubmitTestimonial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description: string; rate: number; type: 'workshop' | 'course' | 'home'; learningCatalogId?: string }) =>
      settingsService.submitTestimonial(payload),
    onSuccess: (_, variables) => {
      if (variables.learningCatalogId) {
        queryClient.invalidateQueries({ queryKey: ['workshop', variables.learningCatalogId] });
        queryClient.invalidateQueries({ queryKey: ['course', variables.learningCatalogId] });
      }
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
};

export const usePaymentHistory = () => {
  return useQuery({
    queryKey: ['payment-history'],
    queryFn: () => authService.getPaymentHistory(),
  });
};
