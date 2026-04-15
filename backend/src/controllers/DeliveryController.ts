import { Request, Response } from 'express';
import { DeliveryStatus, UserRole } from '@ligue-sportive/shared';
import { HttpError } from '../errors/HttpError';
import { DeliveryRepository } from '../repositories/DeliveryRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { toOrderApi } from '../repositories/mappers';

export class DeliveryController {
  static async getDeliveryByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const order = await OrderRepository.findById(req.params.orderId);
      if (!order) throw new HttpError(404, 'Order not found');

      const isAdmin = req.user?.role === UserRole.ADMIN;
      if (!isAdmin && order.user_id !== req.user?._id) {
        throw new HttpError(403, 'Forbidden');
      }

      const delivery = toOrderApi(order).delivery;
      if (!delivery) throw new HttpError(404, 'Delivery not found');

      res.status(200).json({ success: true, data: delivery });
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

  static async updateDeliveryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body as { status: DeliveryStatus };
      if (!Object.values(DeliveryStatus).includes(status)) {
        throw new HttpError(400, 'Invalid status value');
      }

      const updated = await DeliveryRepository.updateStatusByOrderId(req.params.orderId, status);
      if (!updated) throw new HttpError(404, 'Delivery not found');

      res.status(200).json({
        success: true,
        data: {
          _id: updated.id,
          orderId: updated.order_id,
          status: updated.status,
          carrier: updated.carrier ?? undefined,
          trackingCode: updated.tracking_code ?? undefined,
          startedAt: updated.started_at ?? undefined,
          deliveredAt: updated.delivered_at ?? undefined,
          createdAt: updated.created_at,
        },
      });
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

