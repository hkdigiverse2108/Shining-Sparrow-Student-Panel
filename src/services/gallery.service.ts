import client from '../api/client';

export interface GalleryListParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  hasImages?: string;
}

const galleryService = {
  getAllGallery: async (params?: GalleryListParams) => {
    const response = await client.get('/gallery/all', { params });
    return response.data;
  },

  getGalleryById: async (id: string) => {
    const response = await client.get(`/gallery/${id}`);
    return response.data;
  },
};

export default galleryService;
