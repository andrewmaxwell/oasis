import {useQuery} from '@tanstack/react-query';
import {getOrderParents} from '../supabase';
import {queryKeys} from '../queryClient';

export const useOrderParents = (orderId?: string) => {
  const {data, error, refetch} = useQuery({
    queryKey: queryKeys.orderParents(orderId ?? ''),
    queryFn: () => getOrderParents(orderId as string),
    enabled: !!orderId,
  });

  return {orderParents: data, error, refetch};
};
