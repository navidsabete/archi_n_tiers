import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware, adminVendeurMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, OrderController.createOrder);
router.post('/checkout', authMiddleware, OrderController.checkoutOrder);
router.get('/', authMiddleware, OrderController.getUserOrders);
router.get('/:id', authMiddleware, OrderController.getOrderById);
router.patch('/:id/status', authMiddleware, adminVendeurMiddleware, OrderController.updateOrderStatus);

export default router;
