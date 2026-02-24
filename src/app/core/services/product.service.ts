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

  readonly product = this._product.asReadonly();
  readonly loading = this._loading.asReadonly();
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
