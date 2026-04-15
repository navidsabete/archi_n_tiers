import { Request, Response } from 'express';
import { IOrderItem, OrderStatus } from '@ligue-sportive/shared';
import { UserRole } from '@ligue-sportive/shared';
import { withTransaction } from '../db/transaction';
import { HttpError } from '../errors/HttpError';
import { OrderRepository } from '../repositories/OrderRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { toOrderApi } from '../repositories/mappers';

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;
      const userId = req.user!._id;

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity;
      }

      const order = await OrderRepository.create({
        userId,
        items: (items as IOrderItem[]).map((item: IOrderItem) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
        })),
        totalAmount,
        status: OrderStatus.PENDING,
      });

      res.status(201).json({
        success: true,
        data: toOrderApi(order),
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }

  static async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const { _id: userId, role } = req.user!;
      const filter =
        role === UserRole.ADMIN && req.query.all === 'true' ? {} : { userId };
      const orders = await OrderRepository.findMany(filter);

      res.status(200).json({
        success: true,
        data: orders.map(toOrderApi),
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const order = await OrderRepository.findById(req.params.id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: { message: 'Order not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: toOrderApi(order),
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }

  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body as { status: OrderStatus };

      if (!Object.values(OrderStatus).includes(status)) {
        res.status(400).json({ success: false, error: { message: 'Invalid status value' } });
        return;
      }

      const updated = await withTransaction(async (client) => {
        const order = await OrderRepository.findById(req.params.id, client);
        if (!order) throw new HttpError(404, 'Order not found');

        const prev = order.status as OrderStatus;
        if (prev === status) throw new HttpError(400, 'Order already has this status');

        const items = (Array.isArray(order.items) ? (order.items as IOrderItem[]) : []) as IOrderItem[];

        if (status === OrderStatus.CONFIRMED && prev === OrderStatus.PENDING) {
          for (const item of items) {
            const { rows } = await client.query<{ stock: number }>(
              `SELECT stock FROM products WHERE id = $1 LIMIT 1`,
              [item.productId]
            );
            if (!rows[0]) throw new HttpError(400, `Product ${item.productName} not found`);
            if (rows[0].stock < item.quantity) {
              throw new HttpError(
                400,
                `Insufficient stock for ${item.productName} (available: ${rows[0].stock})`
              );
            }
          }

          for (const item of items) {
            const ok = await ProductRepository.decrementStockIfAvailable(
              item.productId,
              item.quantity,
              client
            );
            if (!ok) {
              throw new HttpError(400, `Insufficient stock for ${item.productName}`);
            }
          }
        }

        if (status === OrderStatus.CANCELLED && prev === OrderStatus.CONFIRMED) {
          for (const item of items) {
            await ProductRepository.incrementStock(item.productId, item.quantity, client);
          }
        }

        const saved = await OrderRepository.updateStatus(req.params.id, status, client);
        if (!saved) throw new HttpError(404, 'Order not found');
        return saved;
      });

      res.status(200).json({ success: true, data: toOrderApi(updated) });
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        res.status(error.status).json({ success: false, error: { message: error.message } });
        return;
      }
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }
}
