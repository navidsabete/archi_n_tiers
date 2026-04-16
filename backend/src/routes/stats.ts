import { Router } from 'express';
import { StatsController } from '../controllers/StatsController';
import { authMiddleware, adminVendeurMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminVendeurMiddleware);

router.get('/', StatsController.getStats);

export default router;