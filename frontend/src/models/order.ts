/**
 * Order Model - Business layer for Order operations
 * Consumes ApiService and exposes typed Order operations to the frontend
 */

import { IOrder, IOrderItem } from '@ligue-sportive/shared';
import { ICheckoutPaymentInput } from '@ligue-sportive/shared';
import { ApiService } from './api';

export class OrderModel {
  static async create(items: IOrderItem[]): Promise<IOrder> {
    return ApiService.createOrder(items);
  }

  static async checkout(items: IOrderItem[], payment: ICheckoutPaymentInput): Promise<IOrder> {
    return ApiService.checkoutOrder(items, payment);
  }

  static async getAll(all = false): Promise<IOrder[]> {
    return ApiService.getOrders(all);
  }

  static async getById(orderId: string): Promise<IOrder> {
    return ApiService.getOrderById(orderId);
  }
}
