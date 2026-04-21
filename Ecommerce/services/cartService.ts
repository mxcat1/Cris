import axios from 'axios';
import { API_URL } from '../config/constants';
import { ecommerceAuthService } from './ecommerceApi';

const CART_STORAGE_KEY = 'catalogo_cart_items';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  imagen?: string;
  quantity: number;
}

export interface CartServiceType {
  // Local operations
  getCart: () => CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartCount: () => number;

  // API operations (for authenticated users)
  syncCart: () => Promise<void>;
  mergeLocalCartToServer: () => Promise<void>;
}

class CartService implements CartServiceType {

  private isAuthenticated(): boolean {
    return ecommerceAuthService.isAuthenticated();
  }

  private getToken(): string | null {
    return ecommerceAuthService.getToken();
  }

  private getLocalCart(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private saveLocalCart(items: CartItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('catalogo_cart_items_updated'));
  }

  // Get cart (from localStorage for guest, from API for authenticated)
  getCart(): CartItem[] {
    return this.getLocalCart();
  }

  // Add to cart
  async addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1): Promise<void> {
    // Always update localStorage first (for immediate UI update)
    const localCart = this.getLocalCart();
    const existingIndex = localCart.findIndex(i => i.productId === item.productId);

    if (existingIndex >= 0) {
      localCart[existingIndex].quantity += quantity;
    } else {
      localCart.push({ ...item, quantity });
    }

    this.saveLocalCart(localCart);

    // If authenticated, also sync to backend
    if (this.isAuthenticated()) {
      try {
        await axios.post(
          `${API_URL}/carrito/items`,
          { id_producto: item.productId, cantidad: quantity },
          { headers: { Authorization: `Bearer ${this.getToken()}` } }
        );
      } catch (error) {
        console.error('Error syncing cart to backend:', error);
        // Keep localStorage change even if API fails
      }
    }
  }

  // Update quantity
  async updateQuantity(productId: number, quantity: number): Promise<void> {
    if (quantity < 1) {
      await this.removeFromCart(productId);
      return;
    }

    const localCart = this.getLocalCart();
    const index = localCart.findIndex(i => i.productId === productId);

    if (index >= 0) {
      localCart[index].quantity = quantity;
      this.saveLocalCart(localCart);

      if (this.isAuthenticated()) {
        try {
          await axios.put(
            `${API_URL}/carrito/items/${productId}`,
            { cantidad: quantity },
            { headers: { Authorization: `Bearer ${this.getToken()}` } }
          );
        } catch (error) {
          console.error('Error updating cart in backend:', error);
        }
      }
    }
  }

  // Remove from cart
  async removeFromCart(productId: number): Promise<void> {
    const localCart = this.getLocalCart();
    const filtered = localCart.filter(i => i.productId !== productId);
    this.saveLocalCart(filtered);

    if (this.isAuthenticated()) {
      try {
        await axios.delete(
          `${API_URL}/carrito/items/${productId}`,
          { headers: { Authorization: `Bearer ${this.getToken()}` } }
        );
      } catch (error) {
        console.error('Error removing from backend cart:', error);
      }
    }
  }

  // Clear cart
  async clearCart(): Promise<void> {
    this.saveLocalCart([]);

    if (this.isAuthenticated()) {
      try {
        await axios.delete(
          `${API_URL}/carrito`,
          { headers: { Authorization: `Bearer ${this.getToken()}` } }
        );
      } catch (error) {
        console.error('Error clearing backend cart:', error);
      }
    }
  }

  // Get cart count
  getCartCount(): number {
    const cart = this.getLocalCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Sync cart from backend (when user logs in or page loads)
  async syncCart(): Promise<void> {
    if (!this.isAuthenticated()) return;

    try {
      const response = await axios.get(`${API_URL}/carrito`, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });

      if (response.data.success && response.data.items.length > 0) {
        // Convert backend format to frontend format
        const backendItems = response.data.items.map((item: any) => ({
          productId: item.producto.id_producto,
          name: item.producto.nombre,
          price: item.producto.es_oferta && item.producto.precio_oferta_con_igv
            ? item.producto.precio_oferta_con_igv
            : item.producto.precio_unitario_con_igv,
          imagen: item.producto.imagen_url,
          quantity: item.cantidad
        }));

        this.saveLocalCart(backendItems);
      }
    } catch (error) {
      console.error('Error syncing cart from backend:', error);
    }
  }

  // Merge localStorage cart to backend on login
  async mergeLocalCartToServer(): Promise<void> {
    if (!this.isAuthenticated()) return;

    const localCart = this.getLocalCart();
    if (localCart.length === 0) return;

    try {
      await axios.post(
        `${API_URL}/carrito/merge`,
        { items: localCart },
        { headers: { Authorization: `Bearer ${this.getToken()}` } }
      );

      // After merge, sync back from server to get updated quantities
      await this.syncCart();
    } catch (error) {
      console.error('Error merging cart to backend:', error);
    }
  }
}

export const cartService = new CartService();
