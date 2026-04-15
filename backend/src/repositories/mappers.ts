import type { IUserResponse, UserRole } from '@ligue-sportive/shared';
import type { IOrder, IOrderItem, OrderStatus } from '@ligue-sportive/shared';

export type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password_hash?: string;
};

export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  stock: number;
  image_url: string | null;
};

export type OrderRow = {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: Date;
  items: unknown;
};

export function toUserResponse(row: UserRow): IUserResponse {
  return {
    _id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as UserRole,
  };
}

export function toProductApi(row: ProductRow): Record<string, unknown> {
  return {
    _id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category,
    stock: row.stock,
    imageUrl: row.image_url ?? undefined,
  };
}

export function toOrderApi(row: OrderRow): IOrder {
  const items = (Array.isArray(row.items) ? row.items : []) as IOrderItem[];
  return {
    _id: row.id,
    userId: row.user_id,
    items,
    totalAmount: row.total_amount,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
  };
}

