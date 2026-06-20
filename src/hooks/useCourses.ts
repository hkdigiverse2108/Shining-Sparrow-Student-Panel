import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import courseService from '../services/course.service';
import type { PurchaseCoursePayload } from '../services/course.service';

export const useCourses = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseService.getAllCourses(params),
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => courseService.getCourseById(id),
    enabled: !!id,
  });
};

export const useMyCourses = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['my-courses', params],
    queryFn: () => courseService.getMyCourses(params),
  });
};

export const usePurchaseCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchaseCoursePayload) => courseService.purchaseCourse(payload),
    onSuccess: () => {
      // Invalidate queries to refresh purchased courses and catalog
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
