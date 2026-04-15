import type { PoolClient } from 'pg';
import { getPool } from '../db/pool';
import { newId } from './id';

type CreateDeliveryInput = {
  orderId: string;
  status: string;
  carrier?: string;
  trackingCode?: string;
  startedAt?: Date;
  deliveredAt?: Date;
};

export type DeliveryRow = {
  id: string;
  order_id: string;
  status: string;
  carrier: string | null;
  tracking_code: string | null;
  started_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
};

export class DeliveryRepository {
  static async create(input: CreateDeliveryInput, client?: PoolClient): Promise<DeliveryRow> {
    const db = client ?? getPool();
    const { rows } = await db.query<DeliveryRow>(
      `INSERT INTO deliveries (
         id, order_id, status, carrier, tracking_code, started_at, delivered_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, order_id, status, carrier, tracking_code, started_at, delivered_at, created_at`,
      [
        newId(),
        input.orderId,
        input.status,
        input.carrier ?? null,
        input.trackingCode ?? null,
        input.startedAt ?? null,
        input.deliveredAt ?? null,
      ]
    );
    return rows[0]!;
  }

  static async findByOrderId(orderId: string, client?: PoolClient): Promise<DeliveryRow | null> {
    const db = client ?? getPool();
    const { rows } = await db.query<DeliveryRow>(
      `SELECT id, order_id, status, carrier, tracking_code, started_at, delivered_at, created_at
       FROM deliveries
       WHERE order_id = $1
       LIMIT 1`,
      [orderId]
    );
    return rows[0] ?? null;
  }

  static async updateStatusByOrderId(
    orderId: string,
    status: string,
    client?: PoolClient
  ): Promise<DeliveryRow | null> {
    const db = client ?? getPool();
    const { rows } = await db.query<DeliveryRow>(
      `UPDATE deliveries
       SET status = $2
       WHERE order_id = $1
       RETURNING id, order_id, status, carrier, tracking_code, started_at, delivered_at, created_at`,
      [orderId, status]
    );
    return rows[0] ?? null;
  }
}

