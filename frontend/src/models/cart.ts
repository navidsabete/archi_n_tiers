/**
 * Cart Service - LocalStorage Management
 */

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

export class CartService {
  static CART_KEY = 'ligue_cart';

  static getCart(): CartItem[] {
    try {
      const cart = localStorage.getItem(CartService.CART_KEY);
      if (!cart) return [];
      const parsed = JSON.parse(cart) as Partial<CartItem>[];
      return Array.isArray(parsed)
        ? parsed
            .filter(
              (item) =>
                typeof item?.productId === 'string' &&
                typeof item?.productName === 'string' &&
                typeof item?.quantity === 'number' &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            )
            .map((item) => ({
              productId: item.productId!,
              productName: item.productName!,
              quantity: item.quantity!,
              unitPriceCents:
                typeof item.unitPriceCents === 'number' && item.unitPriceCents >= 0
                  ? Math.round(item.unitPriceCents)
                  : 0,
            }))
        : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  }

  static addToCart(item: CartItem): void {
    try {
      const cart = CartService.getCart();
      const existingIndex = cart.findIndex(i => i.productId === item.productId);

      if (existingIndex > -1) {
        // Item exists, update quantity
        cart[existingIndex].quantity += item.quantity;
        cart[existingIndex].unitPriceCents = item.unitPriceCents;
      } else {
        // New item, add to cart
        cart.push({ ...item, unitPriceCents: Math.max(0, Math.round(item.unitPriceCents)) });
      }

      localStorage.setItem(CartService.CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  static removeFromCart(productId: string): void {
    try {
      const cart = CartService.getCart();
      const filtered = cart.filter(item => item.productId !== productId);
      localStorage.setItem(CartService.CART_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw new Error('Failed to remove item from cart');
    }
  }

  static clearCart(): void {
    try {
      localStorage.removeItem(CartService.CART_KEY);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error('Failed to clear cart');
    }
  }

  static updateQuantity(productId: string, quantity: number): void {
    try {
      if (quantity <= 0) {
        CartService.removeFromCart(productId);
        return;
      }

      const cart = CartService.getCart();
      const item = cart.find(i => i.productId === productId);

      if (item) {
        item.quantity = quantity;
        localStorage.setItem(CartService.CART_KEY, JSON.stringify(cart));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw new Error('Failed to update quantity');
    }
  }

  static getCartTotal(): number {
    const cart = CartService.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  static getCartTotalCents(): number {
    const cart = CartService.getCart();
    return cart.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0);
  }
}
