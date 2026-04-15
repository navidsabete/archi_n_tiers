import type { PoolClient } from 'pg';
import { getPool } from '../db/pool';
import { newId } from './id';

type CreatePaymentInput = {
  orderId: string;
  amount: number;
  provider: string;
  cardBrand: string;
  cardLast4: string;
  status: string;
  transactionRef: string;
  paidAt?: Date;
};

export class PaymentRepository {
  static async create(input: CreatePaymentInput, client?: PoolClient): Promise<void> {
    const db = client ?? getPool();
    await db.query(
      `INSERT INTO payments (
         id, order_id, amount, provider, card_brand, card_last4, status, transaction_ref, paid_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newId(),
        input.orderId,
        input.amount,
        input.provider,
        input.cardBrand,
        input.cardLast4,
        input.status,
        input.transactionRef,
        input.paidAt ?? null,
      ]
    );
  }
}
