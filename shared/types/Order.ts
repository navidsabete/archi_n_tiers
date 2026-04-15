/**
 * Shared Types - Order
 */

import type { IPayment } from './Payment';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface IOrder {
  _id?: string;
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  payment?: IPayment;
  createdAt?: Date;
}
