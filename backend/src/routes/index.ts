import { Router } from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import orderRoutes from './orders';
import userRoutes from './users';
import statsRoute from './stats';
import deliveryRoutes from './deliveries';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/stats', statsRoute)
router.use('/deliveries', deliveryRoutes);

export default router;
