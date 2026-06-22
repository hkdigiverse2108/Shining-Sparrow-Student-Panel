import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import lmsService from '../services/lms.service';
import type { SubmitExamPayload } from '../services/lms.service';

export const useCourseLessons = (courseId: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['course-lessons', courseId, params],
    queryFn: () => lmsService.getCourseLessons(courseId, params),
    enabled: !!courseId,
  });
};

export const useLesson = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lmsService.getLessonById(lessonId),
    enabled: !!lessonId,
    retry: false, // Don't retry on error (e.g. 403 locked) to fail fast and show lock screen
  });
};

export const useExamForLesson = (courseId: string, courseLessonId: string) => {
  return useQuery({
    queryKey: ['exam-for-lesson', courseId, courseLessonId],
    queryFn: () => lmsService.getExamForLesson(courseId, courseLessonId),
    enabled: !!courseId && !!courseLessonId,
  });
};

export const useExam = (examId: string) => {
  return useQuery({
    queryKey: ['exam', examId],
    queryFn: () => lmsService.getExamById(examId),
    enabled: !!examId,
  });
};

export const useSubmitExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitExamPayload) => lmsService.submitExam(payload),
    onSuccess: () => {
      // Invalidate queries to refresh lessons unlock states and attempt history
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
    },
  });
};

export const useExamAttempts = (courseId: string, examId: string) => {
  return useQuery({
    queryKey: ['exam-attempts', courseId, examId],
    queryFn: () => lmsService.getExamAttempts(courseId, examId),
    enabled: !!courseId && !!examId,
  });
};

export const useWorkshopCurriculums = (workshopId: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['workshop-curriculums', workshopId, params],
    queryFn: () => lmsService.getWorkshopCurriculums(workshopId, params),
    enabled: !!workshopId,
  });
};

export const useCompleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { courseId: string; courseLessonId: string }) => lmsService.completeLesson(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.courseLessonId] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
    },
  });
};
