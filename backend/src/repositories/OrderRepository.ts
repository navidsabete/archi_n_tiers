import type { PoolClient } from 'pg';
import { getPool } from '../db/pool';
import { newId } from './id';
import type { OrderRow } from './mappers';

type OrderItemInput = {
  productId: string;
  productName: string;
  quantity: number;
};

type CreateOrderInput = {
  userId: string;
  items: OrderItemInput[];
  totalAmount: number;
  status: string;
  vendor_name: string;
};

const ORDER_SELECT_SQL = `
SELECT
  o.id,
  o.user_id,
  o.total_amount,
  o.status,
  o.vendor_name,
  o.created_at,
  COALESCE(
    json_agg(
      json_build_object(
        'productId', oi.product_id,
        'productName', oi.product_name,
        'quantity', oi.quantity
      )
      ORDER BY oi.id
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::json
  ) as items,
  CASE
    WHEN p.id IS NULL THEN NULL
    ELSE json_build_object(
      '_id', p.id,
      'orderId', p.order_id,
      'amount', p.amount,
      'provider', p.provider,
      'cardBrand', p.card_brand,
      'cardLast4', p.card_last4,
      'status', p.status,
      'transactionRef', p.transaction_ref,
      'paidAt', p.paid_at,
      'createdAt', p.created_at
    )
  END as payment
  ,
  CASE
    WHEN d.id IS NULL THEN NULL
    ELSE json_build_object(
      '_id', d.id,
      'orderId', d.order_id,
      'status', d.status,
      'carrier', d.carrier,
      'trackingCode', d.tracking_code,
      'startedAt', d.started_at,
      'deliveredAt', d.delivered_at,
      'createdAt', d.created_at
    )
  END as delivery
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN payments p ON p.order_id = o.id
LEFT JOIN deliveries d ON d.order_id = o.id
`;

export class OrderRepository {
  static async create(input: CreateOrderInput, client?: PoolClient): Promise<OrderRow> {
    const db = client ?? getPool();
    const id = newId();

    await db.query(
      `INSERT INTO orders (id, user_id, total_amount, status)
       VALUES ($1, $2, $3, $4)`,
      [id, input.userId, input.totalAmount, input.status]
    );

    for (const item of input.items) {
      await db.query(
        `INSERT INTO order_items (id, order_id, product_id, product_name, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId(), id, item.productId, item.productName, item.quantity]
      );
    }

    const created = await this.findById(id, client);
    if (!created) throw new Error('Order creation failed');
    return created;
  }

  static async findById(id: string, client?: PoolClient): Promise<OrderRow | null> {
    const db = client ?? getPool();
      const { rows } = await db.query<OrderRow>(
        `${ORDER_SELECT_SQL}
        WHERE o.id = $1
        GROUP BY o.id, p.id, d.id`,
        [id]
      );
    return rows[0] ?? null;
  }

  static async findMany(
    filter: { userId?: string },
    client?: PoolClient
  ): Promise<OrderRow[]> {
    const db = client ?? getPool();

    if (filter.userId) {
      const { rows } = await db.query<OrderRow>(
        `${ORDER_SELECT_SQL}
         WHERE o.user_id = $1
         GROUP BY o.id, p.id, d.id
         ORDER BY o.created_at DESC`,
        [filter.userId]
      );
      return rows;
    }

    const { rows } = await db.query<OrderRow>(
      `${ORDER_SELECT_SQL}
       GROUP BY o.id, p.id, d.id
       ORDER BY o.created_at DESC`
    );
    return rows;
  }

  static async updateStatus(
    id: string,
    status: string,
    vendor_name: string,
    client?: PoolClient
  ): Promise<OrderRow | null> {
    const db = client ?? getPool();
    const result = await db.query(
      `UPDATE orders
       SET status = $2, vendor_name = $3
       WHERE id = $1`,
      [id, status, vendor_name]
    );
    if (result.rowCount === 0) return null;
    return this.findById(id, client);
  }

  static async getItems(
    orderId: string,
    client?: PoolClient
  ): Promise<OrderItemInput[]> {
    const db = client ?? getPool();
    const { rows } = await db.query<OrderItemInput>(
      `SELECT product_id as "productId", product_name as "productName", quantity
       FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [orderId]
    );
    return rows;
  }
}
