import client from '../api/client';

export interface BlogListParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const blogService = {
  getAllBlogs: async (params?: BlogListParams) => {
    const response = await client.get('/blog/all', { params });
    return response.data;
  },

  getBlogById: async (id: string) => {
    const response = await client.get(`/blog/${id}`);
    return response.data;
  },
};

export default blogService;
