/**
 * Shared Types - Order
 */

import type { IPayment } from './Payment';
import type { IDelivery } from './Delivery';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents?: number;
  lineTotalCents?: number;
}

export interface IOrder {
  _id?: string;
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  vendor_name?: string;
  payment?: IPayment;
  delivery?: IDelivery;
  createdAt?: Date;
}
