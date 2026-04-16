import type { IUserResponse, UserRole } from '@ligue-sportive/shared';
import type { IOrder, IOrderItem, OrderStatus } from '@ligue-sportive/shared';
import type { IPayment, PaymentStatus } from '@ligue-sportive/shared';
import type { ITopSale, ITopCategory, IUserRoleStat } from '@ligue-sportive/shared';
import type { IDelivery, DeliveryStatus } from '@ligue-sportive/shared';

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
  price_cents: number;
  image_url: string | null;
};

export type OrderRow = {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: Date;
  items: unknown;
  payment: unknown;
  delivery: unknown;
};

export type TopSaleRow = {
  id: string;
  product_name: string;
  total_sold: number;
};

export type TopCategoryRow = {
  category: string;
  product_count: number;
};

export type UserRoleStatsRow = {
  user_role: string;
  user_count: number;
  percentage: number;
};

export type PlatformCommissionRow = {
  total_platform_commission_cents: number;
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
    priceCents: Number(row.price_cents),
    imageUrl: row.image_url ?? undefined,
  };
}

export function toOrderApi(row: OrderRow): IOrder {
  const items = (Array.isArray(row.items) ? row.items : []) as IOrderItem[];
  const payment = (row.payment && typeof row.payment === 'object'
    ? (row.payment as IPayment)
    : undefined) as IPayment | undefined;
  const delivery = (row.delivery && typeof row.delivery === 'object'
    ? (row.delivery as IDelivery)
    : undefined) as IDelivery | undefined;

  if (payment?.status) {
    payment.status = payment.status as PaymentStatus;
  }
  if (delivery?.status) {
    delivery.status = delivery.status as DeliveryStatus;
  }

  return {
    _id: row.id,
    userId: row.user_id,
    items,
    totalAmount: row.total_amount,
    status: row.status as OrderStatus,
    payment,
    delivery,
    createdAt: row.created_at,
  };
}

export function toTopSaleApi(row: TopSaleRow): ITopSale {
  return {
    _id: row.id,
    productName: row.product_name,
    totalSold: Number(row.total_sold),
  };
}

export function toTopCategoryApi(row: TopCategoryRow): ITopCategory {
  return {
    category: row.category,
    productCount: Number(row.product_count),
  };
}

export function toUserRoleStatApi(row: UserRoleStatsRow): IUserRoleStat {
  return {
    userRole: row.user_role as UserRole,
    userCount: Number(row.user_count),
    percentage: Number(row.percentage),
  };
}
