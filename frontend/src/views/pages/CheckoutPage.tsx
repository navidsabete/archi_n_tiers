/**
 * Checkout Page - Fake Visa payment form
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartService, CartItem } from '../../models/cart';
import { OrderModel } from '../../models/order';

const digitsOnly = (value: string): string => value.replace(/\D/g, '');

const formatCardNumber = (value: string): string =>
  digitsOnly(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();

const formatExpiry = (value: string): string => {
  const clean = digitsOnly(value).slice(0, 4);
  if (clean.length <= 2) return clean;
  return `${clean.slice(0, 2)}/${clean.slice(2)}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentCart = CartService.getCart();
    setCart(currentCart);
    if (currentCart.length === 0) {
      navigate('/cart');
    }
  }, [navigate]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const validateForm = (): string | null => {
    const normalizedNumber = digitsOnly(cardNumber);
    
    if (cardholderName.trim().length < 2) return 'Nom du porteur invalide';
    if (!normalizedNumber) return 'Numéro de carte invalide'; 
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return 'Date d\'expiration invalide (MM/AA)';
    if (!/^\d{3}$/.test(cvv)) return 'CVV invalide (3 chiffres)';
    
    return null;
};

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      await OrderModel.checkout(cart, {
        cardholderName: cardholderName.trim(),
        cardNumber: digitsOnly(cardNumber),
        expiry,
        cvv,
      });
      CartService.clearCart();
      navigate('/orders');
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur de paiement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">💳 Paiement sécurisé (factice)</h1>
      </div>

      <div className="checkout-layout">
        <div className="card checkout-panel">
          <div className="card-header">
            <strong>Carte Visa</strong>
            <span className="checkout-provider">VISA</span>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="fake-card-preview">
              <div className="fake-card-brand">VISA</div>
              <div className="fake-card-number">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="fake-card-meta">
                <span>{cardholderName || 'PORTEUR DE CARTE'}</span>
                <span>{expiry || 'MM/AA'}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="cardholderName">Nom du porteur</label>
                <input
                  id="cardholderName"
                  className="form-control"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cardNumber">Numéro de carte</label>
                <input
                  id="cardNumber"
                  className="form-control"
                  inputMode="numeric"
                  maxLength={19}
                  placeholder="4XXX XXXX XXXX XXXX"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  required
                />
              </div>

              <div className="checkout-inline-fields">
                <div className="form-group">
                  <label className="form-label" htmlFor="expiry">Expiration</label>
                  <input
                    id="expiry"
                    className="form-control"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cvv">CVV</label>
                  <input
                    id="cvv"
                    className="form-control"
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, 3))}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate('/cart')}
                  disabled={isLoading}
                >
                  Retour panier
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isLoading || totalItems === 0}
                >
                  {isLoading ? 'Paiement en cours...' : 'Payer maintenant'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card checkout-summary-panel">
          <div className="card-header">
            <strong>Résumé de commande</strong>
          </div>
          <div className="card-body">
            <ul className="checkout-items-list">
              {cart.map((item) => (
                <li key={item.productId}>
                  <span>{item.productName}</span>
                  <strong>× {item.quantity}</strong>
                </li>
              ))}
            </ul>
            <div className="checkout-total-row">
              <span>Total articles</span>
              <strong>{totalItems}</strong>
            </div>
            <p className="text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
              Paiement de démonstration: carte Visa factice uniquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
