import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import workshopService from '../services/workshop.service';
import type { PurchaseWorkshopPayload } from '../services/workshop.service';

export const useWorkshops = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: ['workshops', params],
    queryFn: () => workshopService.getAllWorkshops(params),
  });
};

export const useWorkshop = (id: string) => {
  return useQuery({
    queryKey: ['workshop', id],
    queryFn: () => workshopService.getWorkshopById(id),
    enabled: !!id,
  });
};

export const useMyWorkshops = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['my-workshops', params],
    queryFn: () => workshopService.getMyWorkshops(params),
  });
};

export const usePurchaseWorkshop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchaseWorkshopPayload) => workshopService.purchaseWorkshop(payload),
    onSuccess: () => {
      // Invalidate queries to refresh purchased workshops and catalog
      queryClient.invalidateQueries({ queryKey: ['my-workshops'] });
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
    },
  });
};
