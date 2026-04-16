import { getPool } from '../db/pool';
import { newId } from './id';
import type { ProductRow } from './mappers';

type CreateProductInput = {
  name: string;
  description?: string;
  category: string;
  stock: number;
  priceCents: number;
  imageUrl?: string;
};

export class ProductRepository {
  static async findAll(category?: string): Promise<ProductRow[]> {
    if (category) {
      const { rows } = await getPool().query<ProductRow>(
        `SELECT id, name, description, category, stock, image_url
         , price_cents
         FROM products
         WHERE category = $1
         ORDER BY name ASC`,
        [category]
      );
      return rows;
    }

    const { rows } = await getPool().query<ProductRow>(
      `SELECT id, name, description, category, stock, image_url, price_cents
       FROM products
       ORDER BY name ASC`
    );
    return rows;
  }

  static async findById(id: string): Promise<ProductRow | null> {
    const { rows } = await getPool().query<ProductRow>(
      `SELECT id, name, description, category, stock, image_url, price_cents
       FROM products
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  static async create(input: CreateProductInput): Promise<ProductRow> {
    const id = newId();
    const { rows } = await getPool().query<ProductRow>(
      `INSERT INTO products (id, name, description, category, stock, price_cents, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, description, category, stock, price_cents, image_url`,
      [
        id,
        input.name,
        input.description ?? null,
        input.category,
        input.stock,
        input.priceCents,
        input.imageUrl ?? null,
      ]
    );
    return rows[0]!;
  }

  static async updateById(
    id: string,
    input: Partial<CreateProductInput>
  ): Promise<ProductRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (typeof input.name === 'string') {
      sets.push(`name = $${i++}`);
      values.push(input.name);
    }
    if (typeof input.description === 'string' || input.description === undefined) {
      if ('description' in input) {
        sets.push(`description = $${i++}`);
        values.push(input.description ?? null);
      }
    }
    if (typeof input.category === 'string') {
      sets.push(`category = $${i++}`);
      values.push(input.category);
    }
    if (typeof input.stock === 'number') {
      sets.push(`stock = $${i++}`);
      values.push(input.stock);
    }
    if (typeof input.priceCents === 'number') {
      sets.push(`price_cents = $${i++}`);
      values.push(input.priceCents);
    }
    if (typeof input.imageUrl === 'string' || input.imageUrl === undefined) {
      if ('imageUrl' in input) {
        sets.push(`image_url = $${i++}`);
        values.push(input.imageUrl ?? null);
      }
    }

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await getPool().query<ProductRow>(
      `UPDATE products
       SET ${sets.join(', ')}
       WHERE id = $${i}
       RETURNING id, name, description, category, stock, price_cents, image_url`,
      values
    );
    return rows[0] ?? null;
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await getPool().query(`DELETE FROM products WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async decrementStockIfAvailable(
    productId: string,
    quantity: number,
    client: { query: (sql: string, params?: unknown[]) => Promise<{ rowCount: number }> }
  ): Promise<boolean> {
    const result = await client.query(
      `UPDATE products
       SET stock = stock - $2
       WHERE id = $1 AND stock >= $2`,
      [productId, quantity]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async incrementStock(
    productId: string,
    quantity: number,
    client: { query: (sql: string, params?: unknown[]) => Promise<{ rowCount: number }> }
  ): Promise<void> {
    await client.query(`UPDATE products SET stock = stock + $2 WHERE id = $1`, [productId, quantity]);
  }
}
