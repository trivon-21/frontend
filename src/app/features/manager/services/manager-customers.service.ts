import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface CustomerSummaryKPI {
  totalCustomers: number;
  activeCustomers: number;
  customersWithHistory: number;
  totalInstances: number;
}

export interface CustomerDirectoryItem {
  _id: string;
  fullName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  gender: string;
  isActive: boolean;
  totalInstances: number;
  breakdown: {
    orders: number;
    services: number;
    installations: number;
    inquiries: number;
  };
  lastInteractionDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerListResponse {
  success: boolean;
  summary: CustomerSummaryKPI;
  customers: CustomerDirectoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerInstance {
  id: string;
  type: string;
  reference: string;
  summary: string;
  date: string;
  status: string;
}

export interface CustomerDetailData {
  customer: {
    _id: string;
    fullName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    gender: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
  };
  totalInstances: number;
  instances: CustomerInstance[];
}

export interface CustomerDetailResponse {
  success: boolean;
  data: CustomerDetailData;
}

export interface CustomerFilterQuery {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OrderCustomerInfo {
  id?: string;
  fullName: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface OrderItemDetail {
  name: string;
  price: number;
  quantity: number;
  purchaseType?: string;
  total: number;
}

export interface ServiceRequestDetail {
  serviceType: string;
  acUnitModel?: string;
  acUnitSerial?: string;
  acWarrantyStatus?: string;
  acAmcStatus?: string;
  problemDescription?: string;
  problemImageUrl?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  estimatedCharges?: number;
}

export interface OrderLookupResult {
  id: string;
  category: 'Product Order' | 'Installation Order' | 'Service Request';
  reference: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  orderStatus: string;
  customer: OrderCustomerInfo;
  shippingDetails?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  items?: OrderItemDetail[];
  serviceDetails?: ServiceRequestDetail;
  subtotal?: number;
  additionalCharges?: number;
  total: number;
  paymentSlip?: string;
  deliveryTrackingId?: string;
  deliveryPartnerUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderLookupResponse {
  success: boolean;
  data: OrderLookupResult;
}

@Injectable({
  providedIn: 'root',
})
export class ManagerCustomersService {
  constructor(private readonly api: ApiService) {}

  getCustomers(filterQuery: CustomerFilterQuery = {}): Observable<CustomerListResponse> {
    let params = new HttpParams();

    if (filterQuery.search && filterQuery.search.trim()) {
      params = params.set('search', filterQuery.search.trim());
    }
    if (filterQuery.status && filterQuery.status !== 'all') {
      params = params.set('status', filterQuery.status);
    }
    if (filterQuery.sortBy) {
      params = params.set('sortBy', filterQuery.sortBy);
    }
    if (filterQuery.sortOrder) {
      params = params.set('sortOrder', filterQuery.sortOrder);
    }
    if (filterQuery.page) {
      params = params.set('page', filterQuery.page.toString());
    }
    if (filterQuery.limit) {
      params = params.set('limit', filterQuery.limit.toString());
    }

    return this.api.get<CustomerListResponse>('/manager/customers', params);
  }

  getCustomerDetails(customerId: string): Observable<CustomerDetailResponse> {
    return this.api.get<CustomerDetailResponse>(`/manager/customers/${customerId}`);
  }

  lookupOrder(ref: string): Observable<OrderLookupResponse> {
    const params = new HttpParams().set('ref', ref.trim());
    return this.api.get<OrderLookupResponse>('/manager/orders/lookup', params);
  }
}
