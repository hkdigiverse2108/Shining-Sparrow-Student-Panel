import client from '../api/client';

export interface NewsletterPayload {
  email: string;
}

export interface ContactUsPayload {
  name: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
}

const settingsService = {
  getSettings: async () => {
    const response = await client.get('/settings/all');
    return response.data;
  },

  getHeroBanners: async (params?: { page?: number; limit?: number; type?: string }) => {
    const response = await client.get('/hero-banner/all', {
      params: { type: 'web', ...params },
    });
    return response.data;
  },

  getTestimonials: async (params?: { page?: number; limit?: number; type?: string }) => {
    const response = await client.get('/testimonial/all', {
      params: { type: 'course', ...params },
    });
    return response.data;
  },

  getFAQs: async (params?: { page?: number; limit?: number; search?: string; type?: string; learningCatalogFilter?: string }) => {
    const response = await client.get('/faq/all', {
      params,
    });
    return response.data;
  },

  submitTestimonial: async (payload: { name: string; description: string; rate: number; type: 'workshop' | 'course'; learningCatalogId: string }) => {
    const response = await client.post('/testimonial/add', payload);
    return response.data;
  },

  subscribeNewsletter: async (payload: NewsletterPayload) => {
    const response = await client.post('/newsletter/add', payload);
    return response.data;
  },

  contactUs: async (payload: ContactUsPayload) => {
    const response = await client.post('/get-in-touch/add', payload);
    return response.data;
  },
};

export default settingsService;
