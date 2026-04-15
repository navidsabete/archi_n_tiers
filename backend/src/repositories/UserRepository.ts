import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { getPool } from '../db/pool';
import { newId } from './id';
import type { UserRow } from './mappers';

type CreateUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type UserWithPasswordRow = UserRow & { password_hash: string };

export class UserRepository {
  static async findByEmail(email: string): Promise<UserWithPasswordRow | null> {
    const { rows } = await getPool().query<UserWithPasswordRow>(
      `SELECT id, email, first_name, last_name, role, password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email.toLowerCase()]
    );
    return rows[0] ?? null;
  }

  static async findAll(): Promise<UserRow[]> {
    const { rows } = await getPool().query<UserRow>(
      `SELECT id, email, first_name, last_name, role
       FROM users
       ORDER BY created_at DESC`
    );
    return rows;
  }

  static async findById(id: string): Promise<UserRow | null> {
    const { rows } = await getPool().query<UserRow>(
      `SELECT id, email, first_name, last_name, role
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  static async create(input: CreateUserInput): Promise<UserRow> {
    const id = newId();
    const passwordHash = await bcrypt.hash(input.password, 10);

    const { rows } = await getPool().query<UserRow>(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role`,
      [id, input.email.toLowerCase(), passwordHash, input.firstName, input.lastName, input.role]
    );
    return rows[0]!;
  }

  static async updateById(
    id: string,
    input: { firstName?: string; lastName?: string; role?: string }
  ): Promise<UserRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (typeof input.firstName === 'string') {
      sets.push(`first_name = $${i++}`);
      values.push(input.firstName);
    }
    if (typeof input.lastName === 'string') {
      sets.push(`last_name = $${i++}`);
      values.push(input.lastName);
    }
    if (typeof input.role === 'string') {
      sets.push(`role = $${i++}`);
      values.push(input.role);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await getPool().query<UserRow>(
      `UPDATE users
       SET ${sets.join(', ')}
       WHERE id = $${i}
       RETURNING id, email, first_name, last_name, role`,
      values
    );
    return rows[0] ?? null;
  }

  static async deleteById(id: string): Promise<boolean> {
    const result = await getPool().query(`DELETE FROM users WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async verifyPassword(
    user: UserWithPasswordRow,
    plainPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.password_hash);
  }

  static async ensureEmailUnique(email: string, client?: PoolClient): Promise<boolean> {
    const db = client ?? getPool();
    const { rows } = await db.query<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists`,
      [email.toLowerCase()]
    );
    return rows[0]?.exists === false;
  }
}

