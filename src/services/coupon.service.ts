import client from '../api/client';

export interface ValidateCouponPayload {
  code: string;
  amount: number;
  appliesToId?: string;
}

export interface ValidateCouponResponse {
  statusCode: number;
  message: string;
  data: {
    discountAmount: number;
    finalAmount: number;
    coupon: {
      _id: string;
      title: string;
      code: string;
      discountType: 'percentage' | 'flat';
      discountValue: number;
      minOrderAmount: number;
      maxDiscountAmount?: number;
      startDate: string;
      endDate: string;
      usageLimit?: number | null;
      usedCount: number;
      appliesTo: 'course' | 'workshop' | 'default';
      specificIds: string[];
      status: string;
    };
  };
}

const couponService = {
  validateCoupon: async (payload: ValidateCouponPayload): Promise<ValidateCouponResponse> => {
    const response = await client.post('/coupon-code/validate', payload);
    return response.data;
  },
};

export default couponService;
