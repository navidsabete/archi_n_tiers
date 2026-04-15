import { DeliveryStatus } from '@ligue-sportive/shared';

const LABELS: Record<DeliveryStatus, string> = {
  [DeliveryStatus.IN_PROGRESS]: '🚚 Livraison en cours',
  [DeliveryStatus.DELIVERED]: '📦 Livrée',
  [DeliveryStatus.CANCELLED]: '❌ Livraison annulée',
};

const CLASSES: Record<DeliveryStatus, string> = {
  [DeliveryStatus.IN_PROGRESS]: 'badge badge-pending',
  [DeliveryStatus.DELIVERED]: 'badge badge-confirmed',
  [DeliveryStatus.CANCELLED]: 'badge badge-neutral',
};

export function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  return <span className={CLASSES[status]}>{LABELS[status]}</span>;
}

