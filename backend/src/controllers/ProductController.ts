import { Request, Response } from 'express';
import { ProductRepository } from '../repositories/ProductRepository';
import { toProductApi } from '../repositories/mappers';

export class ProductController {
  static async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;
      const products = await ProductRepository.findAll(category);
      res.status(200).json({ success: true, data: products.map(toProductApi) });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }

  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductRepository.findById(req.params.id);
      if (!product) {
        res.status(404).json({ success: false, error: { message: 'Produit non trouvé' } });
        return;
      }
      res.status(200).json({ success: true, data: toProductApi(product) });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }

  static async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { _id, ...payload } = (req.body ?? {}) as Record<string, unknown>;
      void _id;
      const savedProduct = await ProductRepository.create(payload as any);
      res.status(201).json({ success: true, data: toProductApi(savedProduct) });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }

  static async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { _id, ...payload } = (req.body ?? {}) as Record<string, unknown>;
      void _id;
      const updatedProduct = await ProductRepository.updateById(req.params.id, payload as any);
      if (!updatedProduct) {
        res.status(404).json({ success: false, error: { message: 'Produit non trouvé' } });
        return;
      }
      res.status(200).json({ success: true, data: toProductApi(updatedProduct) });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }

  static async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await ProductRepository.deleteById(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: { message: 'Produit non trouvé' } });
        return;
      }
      res.status(200).json({ success: true, data: { message: 'Produit supprimé avec succès' } });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { message: error instanceof Error ? error.message : 'Internal server error' },
      });
    }
  }
}
