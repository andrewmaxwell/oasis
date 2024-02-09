import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {CircularProgress} from '@mui/material';
import {consolidateOrderKids} from '../../utils/consolidateOrderKids';
import {getOrderParents} from '../../supabase';
import {OrderParent} from '../../types';
import {splitEvery} from '../../utils/splitEvery';

export const LabelPage = () => {
  const [orderParents, setOrderParents] = useState<OrderParent[]>();
  const {id: orderId} = useParams();

  useEffect(() => {
    if (orderId) {
      getOrderParents(orderId).then(setOrderParents);
    }
  }, [orderId]);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      body {
        margin: 0;
        padding: 0;
        color: black;
        background: white;
      }
      .page {
        page-break-after: always;
        position: relative;
        width: 8.5in;
        height: 11in;
        outline: 1px solid black;
        padding: 0.5in 0 0.49in 0.166in
      }
      .label {
        outline: 1px dashed #AAA;
        width: 4in;
        height: 2in;
        float: left;
        box-sizing: border-box;
        padding: 0.1in 0 0 0.2in;
        margin-right: 0.167in;
        border-radius: 0.1in;
      }
      .page-break {
        clear: left;
        display: block;
        page-break-before: always;
      }
      
      @media print {
        .page, .label {outline: 0}
      }
      `;
    document.head.append(styleTag);

    return () => styleTag.remove();
  }, []);

  if (!orderParents) return <CircularProgress />;

  return splitEvery(
    10,
    orderParents.toSorted((a, b) =>
      a.deliverer_name.localeCompare(b.deliverer_name),
    ),
  ).map((arr) => (
    <div key={arr[0].parent_id} className="page">
      {arr.map((p) => (
        <div key={p.parent_id} className="label">
          <div>{p.parent_name}</div>
          <div>{p.address}</div>
          <div>
            {p.city} {p.zip}
          </div>
          {p.phone_number && p.phone_number !== '???' && (
            <div>{p.phone_number}</div>
          )}
          <div>{consolidateOrderKids(p.order_kids)}</div>
          <div>
            Deliverer:{' '}
            {p.deliverer_name === 'Unassigned' ? '' : p.deliverer_name}
          </div>
        </div>
      ))}
      <div className="pageBreak" />
    </div>
  ));
};
