/**
 * Admin Orders Page
 * Lists all orders with inline status management and stock feedback
 */

import { useState, useEffect } from 'react';
import { OrderModel } from '../../models/order';
import { ApiService } from '../../models/api';
import { DeliveryStatus, IOrder, OrderStatus } from '@ligue-sportive/shared';
import { DeliveryBadge } from '../components/DeliveryBadge';

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:   '⏳ En attente',
  [OrderStatus.CONFIRMED]: '✅ Confirmée',
  [OrderStatus.CANCELLED]: '❌ Annulée',
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:   [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
};

const badgeClass: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]:   'badge badge-pending',
  [OrderStatus.CONFIRMED]: 'badge badge-confirmed',
  [OrderStatus.CANCELLED]: 'badge badge-neutral',
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deliveryUpdating, setDeliveryUpdating] = useState<string | null>(null);
  const vendor_name = "vendor";
  
  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await OrderModel.getAll(true);
      setOrders(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (order: IOrder, newStatus: OrderStatus) => {
    if (!order._id) return;
    setUpdating(order._id);
    setFeedback(prev => ({ ...prev, [order._id!]: '' }));
    try {
      const updated = await ApiService.updateOrderStatus(order._id, newStatus, vendor_name);
      setOrders(prev => prev.map(o => o._id === order._id ? updated : o));
      const msg = newStatus === OrderStatus.CONFIRMED
        ? '✅ Confirmée — stock décrémenté'
        : newStatus === OrderStatus.CANCELLED && order.status === OrderStatus.CONFIRMED
          ? '❌ Annulée — stock restauré'
          : '❌ Annulée';
      setFeedback(prev => ({ ...prev, [order._id!]: msg }));
      setTimeout(() => setFeedback(prev => ({ ...prev, [order._id!]: '' })), 3000);
    } catch (err: unknown) {
      setFeedback(prev => ({
        ...prev,
        [order._id!]: `⚠️ ${err instanceof Error ? err.message : 'Erreur'}`,
      }));
    } finally {
      setUpdating(null);
    }
  };

  const handleDeliveryStatusChange = async (orderId: string, status: DeliveryStatus) => {
    setDeliveryUpdating(orderId);
    try {
      const updatedDelivery = await ApiService.updateDeliveryStatus(orderId, status, vendor_name);
      setOrders(prev => prev.map(o => o._id === orderId ? ({ ...o, delivery: updatedDelivery }) : o));
    } finally {
      setDeliveryUpdating(null);
    }
  };

  const filtered = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  const counts = Object.values(OrderStatus).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div className="loading-state">Chargement des commandes...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📋 Gestion des commandes</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadOrders}>↻ Rafraîchir</button>
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('')}
        >
          Toutes ({orders.length})
        </button>
        {Object.values(OrderStatus).map(s => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
          >
            {STATUS_LABELS[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">Aucune commande</div>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilisateur</th>
                <th>Vendeur</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Livraison</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order._id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                      #{order._id?.slice(-8)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{order.userId}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {order.vendor_name}
                    </span>
                  </td>
                  <td>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {order.items.map((item, i) => (
                        <li key={i} style={{ fontSize: '13px' }}>
                          {item.productName} <span className="text-muted">× {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td><strong>{order.totalAmount}</strong></td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td>
                    <span className={badgeClass[order.status]}>{order.status}</span>
                  </td>
                  <td>
                    {order.delivery?.status ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <DeliveryBadge status={order.delivery.status} />
                        {order.delivery.status === DeliveryStatus.IN_PROGRESS && (
                          <button
                            className="btn btn-sm btn-success"
                            disabled={deliveryUpdating === order._id}
                            onClick={() => handleDeliveryStatusChange(order._id!, DeliveryStatus.DELIVERED)}
                          >
                            {deliveryUpdating === order._id ? '...' : 'Marquer livrée'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
                      <div className="table-actions">
                        {STATUS_TRANSITIONS[order.status].map(next => (
                          <button
                            key={next}
                            className={`btn btn-sm ${next === OrderStatus.CONFIRMED ? 'btn-success' : 'btn-danger'}`}
                            disabled={updating === order._id}
                            onClick={() => handleStatusChange(order, next)}
                          >
                            {updating === order._id ? '...' : next === OrderStatus.CONFIRMED ? 'Confirmer' : 'Annuler'}
                          </button>
                        ))}
                        {STATUS_TRANSITIONS[order.status].length === 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </div>
                      {feedback[order._id!] && (
                        <span style={{ fontSize: '12px', color: feedback[order._id!].startsWith('⚠️') ? 'var(--clr-danger)' : 'var(--clr-success)' }}>
                          {feedback[order._id!]}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
