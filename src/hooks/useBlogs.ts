import { useQuery } from '@tanstack/react-query';
import blogService from '../services/blog.service';
import type { BlogListParams } from '../services/blog.service';

export const useBlogs = (params?: BlogListParams) => {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: () => blogService.getAllBlogs(params),
  });
};

export const useBlog = (id: string) => {
  return useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogService.getBlogById(id),
    enabled: !!id,
  });
};
