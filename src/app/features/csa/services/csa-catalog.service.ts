import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CsaCatalogProduct {
  _id: string;
  name: string;
  brand: string;
  sku: string;
  itemCode?: string;
  category: string;
  subcategory?: string;
  description: string;
  image: string;
  images?: string[];
  features: string[];
  capacity: number;
  price: number;
  unitCost?: number;
  available?: number;
  availableQuantity?: number;
  inStock: boolean;
  location?: string;
  binLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CsaCatalogResponse {
  success: boolean;
  count?: number;
  products?: CsaCatalogProduct[];
  data?: CsaCatalogProduct[];
}

export interface UpdateCatalogPayload {
  image?: string;
  description?: string;
  features?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CsaCatalogService {
  private apiUrl = `${environment.apiUrl}/csa/catalog`;

  constructor(private http: HttpClient) {}

  getCatalogProducts(search?: string): Observable<CsaCatalogResponse> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<CsaCatalogResponse>(this.apiUrl, { params });
  }

  updateCatalogProduct(id: string, payload: UpdateCatalogPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }
}
