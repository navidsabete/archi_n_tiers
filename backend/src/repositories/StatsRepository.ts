import { getPool } from '../db/pool';
import type {
  TopSaleRow,
  TopCategoryRow,
  UserRoleStatsRow,
  PlatformCommissionRow,
} from './mappers';


export class StatsRepository {

    static async getTopSellingProduct(): Promise<TopSaleRow | null> {
      const { rows } = await getPool().query<TopSaleRow>(
        `
        SELECT 
          p.id,
          p.name AS product_name,
          SUM(oi.quantity) AS total_sold
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
		    WHERE (o.status != 'PENDING' AND o.status != 'CANCELLED')
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 1
        `
      );

      return rows[0] ?? null;
    }

    static async getTopCategory(): Promise<TopCategoryRow | null> {
        const { rows } = await getPool().query<TopCategoryRow>(
          `
          SELECT 
            category,
            COUNT(*) AS product_count
          FROM products
          GROUP BY category
          ORDER BY product_count DESC
          LIMIT 1
          `
        );

        return rows[0] ?? null;
    }       

    static async getUserRoleStats(): Promise<UserRoleStatsRow[]> {
        const { rows } = await getPool().query<UserRoleStatsRow>(
          `
          SELECT 
            u.role AS user_role,
            COUNT(*) AS user_count,
            ROUND(
              COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 
              2
            ) AS percentage
          FROM users u
          GROUP BY u.role
          `
        );
    
        return rows;
    }

    static async getTotalPlatformCommissionCents(): Promise<number> {
        const { rows } = await getPool().query<PlatformCommissionRow>(
          `
          SELECT COALESCE(SUM((amount * 8) / 100), 0) AS total_platform_commission_cents
          FROM payments
          WHERE status = 'APPROVED'
          `
        );

        return Number(rows[0]?.total_platform_commission_cents ?? 0);
    }

} 
