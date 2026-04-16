/**
 * ProductForm Component
 */

import { useEffect, useState } from 'react';
import { Product, ProductCategory } from '../../models/Product';

interface Props {
  product: Product | null;
  onSubmit: (data: Omit<Product, '_id'>, id?: string) => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSubmit, onCancel }: Props) => {
  const [form, setForm] = useState<Omit<Product, '_id'>>({
    name: '',
    description: '',
    category: ProductCategory.FOOTBALL,
    stock: 0,
    priceCents: 0,
    imageUrl: '',
  });

  useEffect(() => {
    if (product) {
      const { _id, ...rest } = product;
      setForm(rest);
    } else {
      setForm({
        name: '',
        description: '',
        category: ProductCategory.FOOTBALL,
        stock: 0,
        priceCents: 0,
        imageUrl: '',
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'stock') {
      setForm({ ...form, stock: Number(e.target.value) });
      return;
    }
    if (e.target.name === 'priceEuros') {
      const parsed = Number(e.target.value);
      setForm({
        ...form,
        priceCents: Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0,
      });
      return;
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, product?._id);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
        {product ? 'Modifier le produit' : 'Ajouter un produit'}
      </h3>

      <div className="form-group">
        <label className="form-label">Nom</label>
        <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-control" name="description" value={form.description} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label className="form-label">Catégorie</label>
        <select className="form-control" name="category" value={form.category} onChange={handleChange}>
          {Object.values(ProductCategory).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Stock</label>
        <input className="form-control" type="number" name="stock" value={form.stock} onChange={handleChange} required min={0} />
      </div>

      <div className="form-group">
        <label className="form-label">Prix (€)</label>
        <input
          className="form-control"
          type="number"
          name="priceEuros"
          step="0.01"
          min={0}
          value={(form.priceCents / 100).toFixed(2)}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">URL de l'image</label>
        <input className="form-control" name="imageUrl" value={form.imageUrl} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          {product ? 'Enregistrer' : 'Ajouter'}
        </button>
        {product && (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;
