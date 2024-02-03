import {Deliverer, Parent} from '../../../types.ts';

export const validateOrder = (
  parents: Parent[] | undefined,
  deliverers: Deliverer[] | undefined,
) => {
  const activeDeliverers = new Set(
    deliverers?.filter((d) => d.is_active).map((d) => d.id),
  );
  const numUnassigned =
    parents?.filter(
      (p) =>
        p.is_active &&
        (!p.deliverer_id || !activeDeliverers.has(p.deliverer_id)),
    ).length || 0;

  if (numUnassigned === 1) {
    return 'There is 1 family without an active deliverer.';
  }
  if (numUnassigned > 1) {
    return `There are ${numUnassigned} families without active deliverers.`;
  }

  return '';
};
