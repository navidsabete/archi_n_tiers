import { Request, Response } from 'express';
import { IOrderItem, OrderStatus } from '@ligue-sportive/shared';
import { ICheckoutPaymentInput, PaymentStatus } from '@ligue-sportive/shared';
import { DeliveryStatus } from '@ligue-sportive/shared';
import { UserRole } from '@ligue-sportive/shared';
import { getPool } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { HttpError } from '../errors/HttpError';
import { DeliveryRepository } from '../repositories/DeliveryRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { toOrderApi } from '../repositories/mappers';

type FakePaymentOutcome =
  | { approved: true; transactionRef: string; cardLast4: string }
  | { approved: false; reason: string };

const normalizeCardNumber = (value: string): string => value.replace(/\s+/g, '');

const validateOrderItems = (items: unknown): IOrderItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Order items are required');
  }

  const normalized: IOrderItem[] = [];
  for (const item of items) {
    const candidate = item as Partial<IOrderItem>;
    if (
      !candidate ||
      typeof candidate.productId !== 'string' ||
      !candidate.productId.trim() ||
      typeof candidate.productName !== 'string' ||
      !candidate.productName.trim() ||
      typeof candidate.quantity !== 'number' ||
      !Number.isInteger(candidate.quantity) ||
      candidate.quantity <= 0
    ) {
      throw new HttpError(400, 'Invalid order item payload');
    }
    normalized.push({
      productId: candidate.productId.trim(),
      productName: candidate.productName.trim(),
      quantity: candidate.quantity,
    });
  }
  return normalized;
};

const validatePaymentInput = (payment: unknown): ICheckoutPaymentInput => {
  const payload = payment as Partial<ICheckoutPaymentInput> | undefined;
  if (!payload) throw new HttpError(400, 'Payment payload is required');

  const cardholderName = typeof payload.cardholderName === 'string'
    ? payload.cardholderName.trim()
    : '';
  const cardNumber = typeof payload.cardNumber === 'string'
    ? normalizeCardNumber(payload.cardNumber)
    : '';
  const expiry = typeof payload.expiry === 'string' ? payload.expiry.trim() : '';
  const cvv = typeof payload.cvv === 'string' ? payload.cvv.trim() : '';

  if (!cardholderName || cardholderName.length < 2) {
    throw new HttpError(400, 'Cardholder name is invalid');
  }
  
  if (!cardNumber) {
    throw new HttpError(400, 'Card number is required');
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    throw new HttpError(400, 'Expiry must use MM/YY format');
  }
  if (!/^\d{3}$/.test(cvv)) {
    throw new HttpError(400, 'CVV must contain 3 digits');
  }

  return {
    cardholderName,
    cardNumber,
    expiry,
    cvv,
  };
};

const simulateFakeVisaPayment = (cardNumber: string): FakePaymentOutcome => {
  const lastDigit = Number(cardNumber[cardNumber.length - 1]);
  if (Number.isNaN(lastDigit)) {
    return { approved: false, reason: 'Unable to read card number' };
  }

  if (lastDigit % 2 !== 0) {
    return { approved: false, reason: 'Fake payment declined by issuer simulation' };
  }

  const ref = `FAKE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    approved: true,
    transactionRef: ref,
    cardLast4: cardNumber.slice(-4),
  };
};

type PricedOrderItem = IOrderItem & {
  unitPriceCents: number;
  lineTotalCents: number;
};

const buildPricedItems = async (
  items: IOrderItem[],
  queryable: {
    query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  }
): Promise<{ pricedItems: PricedOrderItem[]; totalAmount: number }> => {
  let totalAmount = 0;
  const pricedItems: PricedOrderItem[] = [];

  for (const item of items) {
    const { rows } = await queryable.query<{
      id: string;
      name: string;
      stock: number;
      price_cents: number;
    }>(`SELECT id, name, stock, price_cents FROM products WHERE id = $1 LIMIT 1`, [item.productId]);

    const product = rows[0];
    if (!product) {
      throw new HttpError(400, `Product ${item.productName} not found`);
    }

    const lineTotalCents = product.price_cents * item.quantity;
    totalAmount += lineTotalCents;
    pricedItems.push({
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPriceCents: product.price_cents,
      lineTotalCents,
    });
  }

  return { pricedItems, totalAmount };
};

export class OrderController {
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const items = validateOrderItems(req.body?.items);
      const userId = req.user!._id;
      const { pricedItems, totalAmount } = await buildPricedItems(items, getPool());

      const order = await OrderRepository.create({
        userId,
        items: pricedItems,
        totalAmount,
        status: OrderStatus.PENDING,
      });

      res.status(201).json({
        success: true,
        data: toOrderApi(order),
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

  static async checkoutOrder(req: Request, res: Response): Promise<void> {
    try {
      const items = validateOrderItems(req.body?.items);
      const payment = validatePaymentInput(req.body?.payment);
      const userId = req.user!._id;

      const paymentResult = simulateFakeVisaPayment(payment.cardNumber);

      const savedOrder = await withTransaction(async (client) => {
        const { pricedItems, totalAmount } = await buildPricedItems(items, client);
        const createdOrder = await OrderRepository.create(
          {
            userId,
            items: pricedItems,
            totalAmount,
            status: OrderStatus.PENDING,
          },
          client
        );

        if (paymentResult.approved) {
          await PaymentRepository.create(
            {
              orderId: createdOrder.id,
              amount: totalAmount,
              provider: 'FAKE_VISA',
              cardBrand: 'VISA',
              cardLast4: paymentResult.cardLast4,
              status: PaymentStatus.APPROVED,
              transactionRef: paymentResult.transactionRef,
              paidAt: new Date(),
            },
            client
          );

          for (const item of pricedItems) {
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

          for (const item of pricedItems) {
            const ok = await ProductRepository.decrementStockIfAvailable(
              item.productId,
              item.quantity,
              client
            );
            if (!ok) {
              throw new HttpError(400, `Insufficient stock for ${item.productName}`);
            }
          }

          const confirmed = await OrderRepository.updateStatus(
            createdOrder.id,
            OrderStatus.CONFIRMED,
            client
          );
          if (!confirmed) throw new HttpError(500, 'Checkout failed');

          await DeliveryRepository.create(
            {
              orderId: createdOrder.id,
              status: DeliveryStatus.IN_PROGRESS,
              startedAt: new Date(),
            },
            client
          );
        } else {
          await PaymentRepository.create(
            {
              orderId: createdOrder.id,
              amount: totalAmount,
              provider: 'FAKE_VISA',
              cardBrand: 'VISA',
              cardLast4: payment.cardNumber.slice(-4),
              status: PaymentStatus.DECLINED,
              transactionRef: `DECLINED-${Date.now()}`,
            },
            client
          );

          const cancelled = await OrderRepository.updateStatus(
            createdOrder.id,
            OrderStatus.CANCELLED,
            client
          );
          if (!cancelled) throw new HttpError(500, 'Checkout failed');
        }

        const hydrated = await OrderRepository.findById(createdOrder.id, client);
        if (!hydrated) throw new HttpError(500, 'Checkout failed');
        return hydrated;
      });

      if (!paymentResult.approved) {
        res.status(402).json({ success: false, error: { message: paymentResult.reason } });
        return;
      }

      res.status(201).json({ success: true, data: toOrderApi(savedOrder) });
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
