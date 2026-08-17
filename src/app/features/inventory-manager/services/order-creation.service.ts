import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';
import { InventoryItem } from './inventory-domain';
import { PurchaseRequest } from './purchase-workflow';
export type { InventoryItem } from './inventory-domain';

export interface OrderItem {
  inventoryId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  estimatedTotal: number;
  available?: number;
  reserved?: number;
  itemClass?: string;
  subcategory?: string;
  unit?: string;
  manufacturerPartNumber?: string;
  supplierId?: string;
  supplierName?: string;
}

export interface Supplier {
  _id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderCreationService {
  constructor(private apiService: ApiService) {}

  getInventory(): Observable<InventoryItem[]> {
    return this.apiService.get<InventoryItem[]>('/inventory/list');
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.apiService.get<Supplier[]>('/inventory/suppliers');
  }

  addSupplier(name: string): Observable<Supplier> {
    return this.apiService.post<Supplier>('/inventory/suppliers', { name });
  }

  getSuggestedItems(): Observable<InventoryItem[]> {
    return this.apiService.get<InventoryItem[]>('/inventory/suggested-orders');
  }

  getOrderRequests(): Observable<PurchaseRequest[]> {
    return this.apiService.get<PurchaseRequest[]>('/inventory/order-requests');
  }

  submitOrderRequest(payload: any, isEditMode: boolean, orderId?: string): Observable<any> {
    if (isEditMode && orderId) {
      return this.apiService.patch(`/inventory/order-requests/${orderId}`, payload);
    }
    return this.apiService.post('/inventory/order-requests', payload);
  }

  submitForManager(orderId: string): Observable<PurchaseRequest> {
    return this.apiService.post<PurchaseRequest>(`/inventory/order-requests/${orderId}/submit`, {});
  }

  issuePurchaseOrder(orderId: string): Observable<PurchaseRequest> {
    return this.apiService.post<PurchaseRequest>(`/inventory/order-requests/${orderId}/issue-po`, {});
  }
}
