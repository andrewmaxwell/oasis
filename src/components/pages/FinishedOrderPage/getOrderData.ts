import {FinishedOrder, OrderRecord} from '../../../types.ts';
import {getOrderKids, getOrderParents, getRecord} from '../../../supabase.ts';
import {groupBy} from '../../../utils/groupBy.ts';

export const getOrderData = async (
  orderId: string,
): Promise<FinishedOrder | undefined> => {
  const [orderRecord, orderParents, orderKids] = await Promise.all([
    getRecord('order_record', orderId) as Promise<OrderRecord>,
    getOrderParents(orderId),
    getOrderKids(orderId),
  ]);

  if (!orderRecord || !orderParents || !orderKids) return;

  const groupedParents = groupBy(orderParents, (p) => p.deliverer.id);
  const kidIndex = groupBy(orderKids, (k) => k.kid.parent_id);

  // TODO: don't group by deliverer, use a sql view
  return {
    ...orderRecord,
    deliverers: Object.values(groupedParents)
      .map((arr) => ({
        ...arr[0].deliverer,
        orderParents: arr
          .map((a) => ({
            ...a.parent,
            orderKids: kidIndex[a.parent.id] || [],
            deliverer: arr[0].deliverer,
          }))
          .sort(
            (a, b) =>
              a.first_name.localeCompare(b.first_name) ||
              a.last_name.localeCompare(b.last_name),
          ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};
