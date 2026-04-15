import { Router } from 'express';
import { StatsController } from '../controllers/StatsController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', StatsController.getStats);

export default router;