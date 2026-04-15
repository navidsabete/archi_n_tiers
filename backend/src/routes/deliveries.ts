import { Router } from 'express';
import { DeliveryController } from '../controllers/DeliveryController';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/:orderId', authMiddleware, DeliveryController.getDeliveryByOrderId);
router.patch('/:orderId/status', authMiddleware, adminMiddleware, DeliveryController.updateDeliveryStatus);

export default router;

