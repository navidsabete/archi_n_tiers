import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, OrderController.createOrder);
router.get('/', authMiddleware, OrderController.getUserOrders);
router.get('/:id', authMiddleware, OrderController.getOrderById);
router.patch('/:id/status', authMiddleware, adminMiddleware, OrderController.updateOrderStatus);

export default router;
