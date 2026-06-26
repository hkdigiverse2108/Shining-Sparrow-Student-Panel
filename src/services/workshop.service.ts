import client from '../api/client';

export interface PurchaseWorkshopPayload {
  workshop_id: string;
  amount: number;
  payment_id: string;
  payment_method?: string;
  final_amount: number;
  couponCodeId?: string;
  discountAmount?: number;
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
      workshopId: payload.workshop_id,
      amount: payload.amount,
      paymentId: payload.payment_id,
      paymentMethod: payload.payment_method || 'razorpay',
      finalAmount: payload.final_amount,
      couponCodeId: payload.couponCodeId || '',
      discountAmount: payload.discountAmount || 0,
    };
    const response = await client.post('/workshop/purchase', data);
    return response.data;
  },
};

export default workshopService;
