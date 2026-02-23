/**
 * product.service.ts
 * Fetches product data from the Express.js backend API.
 * Exposes a readonly signal that components can consume.
 *
 * Usage: inject(ProductService).product()
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly _product = signal<Product | null>(null);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);

  /** Current product data (null while loading) */
  readonly product = this._product.asReadonly();

  /** Whether the initial fetch is still in progress */
  readonly loading = this._loading.asReadonly();

  /** Error message if the fetch failed */
  readonly error = this._error.asReadonly();

  constructor() {
    this.loadProduct();
  }

  private loadProduct(): void {
    this.http.get<Product[]>('http://localhost:3000/api/products').subscribe({
      next: (data) => {
        this._product.set(data[0] ?? null);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message ?? 'Failed to load product');
        this._loading.set(false);
      },
    });
  }
}
