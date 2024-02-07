import {useEffect, useState} from 'react';
import {FinishedOrder} from '../../types';
import {getOrderData} from './FinishedOrderPage/getOrderData';
import {useParams} from 'react-router-dom';
import {CircularProgress} from '@mui/material';
import {consolidateOrderKids} from '../../utils/consolidateOrderKids';

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
  const [orderRecord, setOrderRecord] = useState<FinishedOrder>();
  const {id: orderId} = useParams();

  useEffect(() => {
    if (orderId) getOrderData(orderId).then(setOrderRecord);
  }, [orderId]);

  if (!orderRecord) return <CircularProgress />;

  return orderRecord.deliverers.map((d) =>
    d.orderParents.map((p) => (
      <div key={p.id} style={labelStyle as any}>
        <div>
          {p.first_name} {p.last_name}
        </div>
        <div>{p.address}</div>
        <div>
          {p.city} {p.zip}
        </div>
        <div style={{marginTop: '1em'}}>
          {consolidateOrderKids(p.orderKids)}
        </div>
        <div>Deliverer: {d.name}</div>
      </div>
    )),
  );
};
