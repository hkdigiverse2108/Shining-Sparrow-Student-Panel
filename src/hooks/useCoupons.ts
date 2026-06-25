import { useMutation } from '@tanstack/react-query';
import couponService from '../services/coupon.service';
import type { ValidateCouponPayload } from '../services/coupon.service';

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: (payload: ValidateCouponPayload) => couponService.validateCoupon(payload),
  });
};
