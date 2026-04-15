import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, ProductController.getAllProducts);
router.get('/:id', authMiddleware, ProductController.getProductById);
router.post('/', authMiddleware, adminMiddleware, ProductController.createProduct);
router.put('/:id', authMiddleware, adminMiddleware, ProductController.updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, ProductController.deleteProduct);

export default router;
