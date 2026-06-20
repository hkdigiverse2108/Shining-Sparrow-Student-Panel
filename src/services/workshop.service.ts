import client from '../api/client';

export interface PurchaseWorkshopPayload {
  workshop_id: string;
  amount: number;
  payment_id: string;
  payment_method?: string;
  final_amount: number;
}

const workshopService = {
  getAllWorkshops: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await client.get('/workshop/all', { params });
    return response.data;
  },

  getWorkshopById: async (id: string) => {
    const response = await client.get(`/workshop/${id}`);
    return response.data;
  },

  getMyWorkshops: async (params?: { page?: number; limit?: number }) => {
    const response = await client.get('/workshop/my-workshops', { params });
    return response.data;
  },

  purchaseWorkshop: async (payload: PurchaseWorkshopPayload) => {
    const data = {
      ...payload,
      payment_method: payload.payment_method || 'razorpay',
    };
    const response = await client.post('/workshop/purchase', data);
    return response.data;
  },
};

export default workshopService;
