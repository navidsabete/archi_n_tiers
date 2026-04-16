/**
 * Shared Types - Stats
 */

import { UserRole } from "./User";

export interface ITopSale {
  _id: string;
  productName: string;
  totalSold: number;
}

export interface ITopCategory {
  category: string;
  productCount: number;
}

export interface IUserRoleStat {
  userRole: UserRole;
  userCount: number;
  percentage: number;
}

export interface IStatsResponse {
  topSale: ITopSale | null;
  topCategory: ITopCategory | null;
  userRoles: IUserRoleStat[];
  totalPlatformCommissionCents: number;
}
