import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  data?: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly API_BASE = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  /**
   * Adds or updates a cart item for the given user.
   */
  addOrUpdateItem(userId: string, productId: string, quantity: number): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.API_BASE}/${userId}/items`, {
      productId,
      quantity
    });
  }

  /**
   * Retrieves the cart for a given user.
   */
  getCart(userId: string): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.API_BASE}/${userId}`);
  }

  /**
   * Removes an item from the cart.
   */
  removeItem(userId: string, productId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.API_BASE}/${userId}/items/${productId}`);
  }
}
