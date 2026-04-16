import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware, adminVendeurMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, ProductController.getAllProducts);
router.get('/:id', authMiddleware, ProductController.getProductById);
router.post('/', authMiddleware, adminVendeurMiddleware , ProductController.createProduct);
router.put('/:id', authMiddleware, adminVendeurMiddleware, ProductController.updateProduct);
router.delete('/:id', authMiddleware, adminVendeurMiddleware, ProductController.deleteProduct);

export default router;
