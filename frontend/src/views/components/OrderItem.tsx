/**
 * OrderItem Component
 */

import { IOrder, OrderStatus } from '@ligue-sportive/shared';
import { DeliveryBadge } from './DeliveryBadge';

interface OrderItemProps {
  order: IOrder;
}

const formatCents = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value / 100);

const statusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:   return 'badge badge-pending';
    case OrderStatus.CONFIRMED: return 'badge badge-confirmed';
    case OrderStatus.CANCELLED: return 'badge badge-cancelled';
    default:                    return 'badge badge-neutral';
  }
};

const OrderItem = ({ order }: OrderItemProps) => (
  <div className="order-card">
    <div className="order-card-header">
      <div>
        <div className="order-id">#{order._id}</div>
        <div className="order-date">
          {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR') : '—'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span className={statusBadgeClass(order.status)}>{order.status}</span>
        {order.delivery?.status && <DeliveryBadge status={order.delivery.status} />}
      </div>
    </div>

    <div className="order-card-body">
      <div className="section-title">Articles</div>
      <ul className="order-items-list">
        {order.items.map((item, i) => (
          <li key={i}>
            <strong>{item.productName}</strong>
            {typeof item.unitPriceCents === 'number' ? (
              <span className="text-muted">
                {' '}
                × {item.quantity} · {formatCents(item.unitPriceCents)} ={' '}
                {formatCents(item.lineTotalCents ?? item.unitPriceCents * item.quantity)}
              </span>
            ) : (
              <span className="text-muted"> × {item.quantity}</span>
            )}
          </li>
        ))}
      </ul>
    </div>

    <div className="order-card-footer">
      <div className="order-footer-details">
        <span className="text-muted">Total commande :</span>
        <span className="order-total">{formatCents(order.totalAmount)}</span>
      </div>
      {order.payment && (
        <div className="order-payment-meta">
          <span className="text-muted">Paiement {order.payment.status}</span>
          <span className="text-muted">
            VISA ****{order.payment.cardLast4} · {order.payment.transactionRef}
          </span>
        </div>
      )}
    </div>
  </div>
);

export default OrderItem;
