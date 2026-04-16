import { Request, Response } from 'express';
import { StatsRepository } from '../repositories/StatsRepository';
import { toTopSaleApi, toTopCategoryApi, toUserRoleStatApi } from '../repositories/mappers';

export class StatsController {
    static async getStats(req: Request, res: Response): Promise<void> {
      try {
            const [topSale, topCategory, userRoles, totalPlatformCommissionCents] = await Promise.all([
              StatsRepository.getTopSellingProduct(),
              StatsRepository.getTopCategory(),
              StatsRepository.getUserRoleStats(),
              StatsRepository.getTotalPlatformCommissionCents(),
            ]);
        
            res.status(200).json({
              success: true,
              data: {
                topSale: topSale ? toTopSaleApi(topSale) : null,
                topCategory: topCategory ? toTopCategoryApi(topCategory) : null,
                userRoles: userRoles.map(toUserRoleStatApi),
                totalPlatformCommissionCents,
              },
            });
          } catch (error: unknown) {
            res.status(500).json({
              success: false,
              error: {
                message:
                  error instanceof Error ? error.message : 'Internal server error',
              },
            });
        }
    }
}
