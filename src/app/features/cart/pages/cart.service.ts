import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// product field can be a plain ID string OR a populated product object
export interface CartItem {
  product: any;
  quantity: number;
  purchaseType?: 'buy_only' | 'buy_and_install';
}

// Flat display model used by the cart component template
export interface DisplayCartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
  capacity: string;
  purchaseType: 'buy_only' | 'buy_and_install';
}

export interface CartResponse {
  cart: {
    userId: string;
    items: CartItem[];
    additionalCharges: number;
  };
  units: number;
  subtotal: number;
  additionalCharges: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  removedItems?: string[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  getCart(userId: string): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.apiUrl}/${userId}`);
  }

  addOrUpdateItem(userId: string, productId: string, quantity: number, purchaseType?: string) {
    return this.http.post<CartResponse>(`${this.apiUrl}/item`, { userId, productId, quantity, purchaseType });
  }

  removeItem(userId: string, productId: string) {
    return this.http.request<CartResponse>('delete', `${this.apiUrl}/item`, { body: { userId, productId } });
  }

  clearCart(userId: string) {
    return this.http.post<CartResponse>(`${this.apiUrl}/clear`, { userId });
  }

  updateAdditionalCharges(userId: string, additionalCharges: number) {
    return this.http.post<CartResponse>(`${this.apiUrl}/charges`, { userId, additionalCharges });
  }
}
