import client from '../api/client';

export interface PurchaseCoursePayload {
  courseId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  couponCodeId?: string;
  discountAmount?: number;
  finalAmount?: number;
}

const courseService = {
  getAllCourses: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await client.get('/course/all', { params });
    return response.data;
  },

  getCourseById: async (id: string) => {
    const response = await client.get(`/course/${id}`);
    return response.data;
  },

  getMyCourses: async (params?: { page?: number; limit?: number }) => {
    const response = await client.get('/course/my-courses', { params });
    return response.data;
  },

  purchaseCourse: async (payload: PurchaseCoursePayload) => {
    const response = await client.post('/course/purchase', payload);
    return response.data;
  },
};

export default courseService;
