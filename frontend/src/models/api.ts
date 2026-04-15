/**
 * API Service - HTTP Client
 * Handles all API calls to backend
 */
import { IProduct, IOrderItem, IOrder, IUserResponse, IAuthResponse, IStatsResponse } from "@ligue-sportive/shared";
import { ICheckoutPaymentInput } from "@ligue-sportive/shared";
import { DeliveryStatus, IDelivery } from "@ligue-sportive/shared";

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiService {
  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private static async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: ApiService.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as {
        error?: string | { message?: string };
        message?: string;
      } | null;
      const message =
        typeof payload?.error === 'string'
          ? payload.error
          : payload?.error?.message || payload?.message || 'API request failed';
      throw new Error(message);
    }

    return response.json();
  }

  // Auth endpoints
  static async login(email: string, password: string): Promise<IAuthResponse> {
    return ApiService.request<IAuthResponse>('POST', '/auth/login', { email, password });
  }

  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<IAuthResponse> {
    return ApiService.request<IAuthResponse>('POST', '/auth/register', data);
  }

  // User endpoints (Admin only)
  static async getUsers(): Promise<IUserResponse[]> {
    return ApiService.request<IUserResponse[]>('GET', '/users');
  }

  static async getUserById(id: string): Promise<IUserResponse> {
    return ApiService.request<IUserResponse>('GET', `/users/${id}`);
  }

  static async updateUser(id: string, data: Partial<Pick<IUserResponse, 'firstName' | 'lastName' | 'role'>>): Promise<IUserResponse> {
    return ApiService.request<IUserResponse>('PUT', `/users/${id}`, data);
  }

  static async deleteUser(id: string): Promise<void> {
    await ApiService.request('DELETE', `/users/${id}`);
  }

  // Order endpoints
  static async createOrder(items: IOrderItem[]): Promise<IOrder> {
    const data = await ApiService.request<{ data: IOrder }>('POST', '/orders', { items });
    return data.data;
  }

  static async checkoutOrder(items: IOrderItem[], payment: ICheckoutPaymentInput): Promise<IOrder> {
    const data = await ApiService.request<{ data: IOrder }>('POST', '/orders/checkout', { items, payment });
    return data.data;
  }

  static async getOrders(all = false): Promise<IOrder[]> {
    const query = all ? '?all=true' : '';
    const data = await ApiService.request<{ data: IOrder[] }>('GET', `/orders${query}`);
    return data.data;
  }

  static async updateOrderStatus(orderId: string, status: string): Promise<IOrder> {
    const data = await ApiService.request<{ data: IOrder }>('PATCH', `/orders/${orderId}/status`, { status });
    return data.data;
  }

  static async getOrderById(orderId: string): Promise<IOrder> {
    const data = await ApiService.request<{ data: IOrder }>('GET', `/orders/${orderId}`);
    return data.data;
  }

  static async getDeliveryByOrderId(orderId: string): Promise<IDelivery> {
    const data = await ApiService.request<{ data: IDelivery }>('GET', `/deliveries/${orderId}`);
    return data.data;
  }

  static async updateDeliveryStatus(orderId: string, status: DeliveryStatus): Promise<IDelivery> {
    const data = await ApiService.request<{ data: IDelivery }>('PATCH', `/deliveries/${orderId}/status`, { status });
    return data.data;
  }

  // Product endpoints
  static async getProducts(category?: string): Promise<IProduct[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const data = await ApiService.request<{ data: IProduct[] }>('GET', `/products${query}`);
    return data.data;
  }

  static async getProductById(id: string): Promise<IProduct> {
    const data = await ApiService.request<{ data: IProduct }>('GET', `/products/${id}`);
    return data.data;
  }

  static async createProduct(product: IProduct): Promise<IProduct> {
    const data = await ApiService.request<{ data: IProduct }>('POST', '/products', product);
    return data.data;
  }

  static async updateProduct(id: string, product: IProduct): Promise<IProduct> {
    const data = await ApiService.request<{ data: IProduct }>('PUT', `/products/${id}`, product);
    return data.data;
  }

  static async deleteProduct(id: string): Promise<void> {
    await ApiService.request('DELETE', `/products/${id}`);
  }

  // Stats endpoints
  static async getStats(): Promise<IStatsResponse> {
    const data = await ApiService.request<{ data: IStatsResponse }>('GET', '/stats');
    return data.data;
  }
  
}
