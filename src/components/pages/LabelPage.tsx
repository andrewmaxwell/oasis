import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {CircularProgress} from '@mui/material';
import {consolidateOrderKids} from '../../utils/consolidateOrderKids';
import {getOrderParents} from '../../supabase';
import {OrderParent} from '../../types';

//  Info: Parent name, Address, Phone #, QTYs and sizes of diapers ordered that month and assigned deliverer (SORT by assigned deliverer)

const labelStyle = {
  width: '3.5in',
  height: '2in',
  textAlign: 'center',
  border: '1px solid black',
  borderRadius: '0.25in',
  padding: '0.25in',
  color: 'black',
  background: 'white',
  float: 'left',
};

export const LabelPage = () => {
  const [orderParents, setOrderParents] = useState<OrderParent[]>();
  const {id: orderId} = useParams();

  useEffect(() => {
    if (orderId) {
      getOrderParents(orderId).then((p) =>
        setOrderParents(
          p.sort((a, b) => a.deliverer_name.localeCompare(b.deliverer_name)),
        ),
      );
    }
  }, [orderId]);

  if (!orderParents) return <CircularProgress />;
  return orderParents.map((p) => (
    <div key={p.parent_id} style={labelStyle as any}>
      <div>{p.parent_name}</div>
      <div>{p.address}</div>
      <div>
        {p.city} {p.zip}
      </div>
      <div style={{marginTop: '1em'}}>{consolidateOrderKids(p.order_kids)}</div>
      <div>Deliverer: {p.deliverer_name}</div>
    </div>
  ));
};
