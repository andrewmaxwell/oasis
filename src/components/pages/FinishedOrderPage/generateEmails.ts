import {OrderParentViewRow, OrderRecord} from '../../../types';
import {consolidateOrderKids} from '../../../utils/consolidateOrderKids';
import {groupBy} from '../../../utils/groupBy';

export const generateEmails = (
  orderRecord: OrderRecord,
  orderParents: OrderParentViewRow[],
) => {
  const grouped = groupBy(orderParents, (p) => p.deliverer_email);

  for (const [email, orderParents] of Object.entries(grouped)) {
    if (!email) continue;
    const parentDetails = orderParents.map(
      (p) => `Name: ${p.parent_name}
Address: ${p.address}, ${p.city} ${p.zip}
Phone: ${p.phone_number}
Diapers: ${consolidateOrderKids(p.order_kids)}`,
    );

    const body = `Date of Next Pickup: ${orderRecord.date_of_pickup}

${parentDetails.join('\n\n')}

If you have questions, please contact Selia Buss at selia.buss@oasis4refugees.org

Please provide feedback on diaper sizes for next month.

Thank you for your service!`;

    window.open(
      `mailto:${email}?subject=Oasis Diaper Ministry Delivery Details&body=${encodeURIComponent(body)}`,
      '_blank',
    );
  }
};
