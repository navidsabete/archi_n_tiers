export enum DeliveryStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface IDelivery {
  _id?: string;
  orderId: string;
  status: DeliveryStatus;
  carrier?: string;
  trackingCode?: string;
  startedAt?: Date;
  deliveredAt?: Date;
  createdAt?: Date;
}

