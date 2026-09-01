import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface User {
  _id: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  authMethods: string[];
  isActive: boolean;
  deactivatedAt?: Date | null;
  deactivationReason?: string;
  reactivatedAt?: Date | null;
  address?: string;
  gender?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  password: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

export interface UsersListResponse {
  message: string;
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UserResponse {
  message: string;
  user: User;
}

export interface DeleteResponse {
  message: string;
  deleted: boolean;
}

export interface ReactivationRequest {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  deactivationReason: string;
  requestedAt: string;
  userReason: string;
  requestStatus: string;
}

export interface ReactivationRequestsResponse {
  message: string;
  data: ReactivationRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface InquiryThreadMessage {
  sender: 'Customer' | 'Support';
  message: string;
  createdAt?: string;
}

export interface InquiryItem {
  _id: string;
  inquiryRef: string;
  customer?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
  name?: string;
  email?: string;
  phone?: string;
  inquiryType: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
  thread: InquiryThreadMessage[];
  status: 'Ongoing' | 'Addressed' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

export interface InquiriesListResponse {
  message: string;
  data: InquiryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ServiceRequestItem {
  _id: string;
  serviceRequestRef: string;
  customer?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address?: string;
  };
  acUnitModel?: string;
  acUnitSerial?: string;
  acWarrantyStatus?: string;
  acAmcStatus?: string;
  serviceType: string;
  serviceTypeOther?: string;
  problemDescription?: string;
  problemImageUrl?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  estimatedCharges?: number;
  paymentRequired?: boolean;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestsListResponse {
  message: string;
  data: ServiceRequestItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface OrderItemProduct {
  product?: string;
  name?: string;
  itemName?: string;
  quantity?: number;
  price?: number;
  purchaseType?: string;
}

export interface OrderItem {
  _id: string;
  orderRef?: string;
  orderNumber?: string;
  customer?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address?: string;
  };
  customerInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  items?: OrderItemProduct[];
  itemName?: string;
  quantity?: number;
  amount?: number;
  total?: number;
  status: string;
  paymentStatus: string;
  orderType: string;
  orderStatus?: string;
  paymentSlipUrl?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListResponse {
  message: string;
  data: OrderItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SuperAdminDashboardSummary {
  users: {
    total: number;
    active: number;
    deactivated: number;
    pendingReactivationRequests: number;
  };
  operations: {
    totalOrders: number;
    pendingOrders: number;
    totalInquiries: number;
    openInquiries: number;
    totalServiceRequests: number;
    openServiceRequests: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SuperAdminService {
  constructor(private apiService: ApiService) {}

  /**
   * List all users with pagination, filters, and search
   */
  listUsers(
    page: number = 1,
    limit: number = 10,
    filters?: {
      role?: string;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      search?: string;
    }
  ): Observable<UsersListResponse> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());

    if (filters?.role) {
      params = params.set('role', filters.role);
    }
    if (filters?.emailVerified !== undefined) {
      params = params.set('emailVerified', filters.emailVerified.toString());
    }
    if (filters?.phoneVerified !== undefined) {
      params = params.set('phoneVerified', filters.phoneVerified.toString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.apiService.get<UsersListResponse>('/super-admin/users', params);
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): Observable<UserResponse> {
    return this.apiService.get<UserResponse>(`/super-admin/users/${userId}`);
  }

  /**
   * Create new user
   */
  createUser(payload: CreateUserPayload): Observable<UserResponse> {
    return this.apiService.post<UserResponse>('/super-admin/users', payload);
  }

  /**
   * Update user
   */
  updateUser(userId: string, payload: UpdateUserPayload): Observable<UserResponse> {
    return this.apiService.put<UserResponse>(`/super-admin/users/${userId}`, payload);
  }

  /**
   * Delete user
   */
  deleteUser(userId: string, hardDelete: boolean = false): Observable<DeleteResponse> {
    return this.apiService.delete<DeleteResponse>(`/super-admin/users/${userId}?hardDelete=${hardDelete}`);
  }

  /**
   * Deactivate user
   */
  deactivateUser(userId: string, reason: string): Observable<UserResponse> {
    return this.apiService.patch<UserResponse>(`/super-admin/users/${userId}/deactivate`, { reason });
  }

  /**
   * Get reactivation requests
   */
  getReactivationRequests(page: number = 1, limit: number = 10): Observable<ReactivationRequestsResponse> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());
    return this.apiService.get<ReactivationRequestsResponse>('/super-admin/reactivation-requests', params);
  }

  getDashboardSummary(): Observable<{ message: string; data: SuperAdminDashboardSummary }> {
    return this.apiService.get<{ message: string; data: SuperAdminDashboardSummary }>(
      '/super-admin/dashboard-summary'
    );
  }

  /**
   * Handle reactivation request (approve/reject)
   */
  handleReactivationRequest(
    userId: string,
    approve: boolean,
    adminResponse: string = ''
  ): Observable<{ message: string; approved: boolean }> {
    return this.apiService.patch<{ message: string; approved: boolean }>(
      `/super-admin/reactivation-requests/${userId}`,
      { approve, adminResponse }
    );
  }

  /**
   * Submit reactivation request (user-facing)
   */
  submitReactivationRequest(email: string, userReason: string): Observable<{ message: string; status: string }> {
    return this.apiService.post<{ message: string; status: string }>('/auth/reactivation-request', {
      email,
      userReason
    });
  }

  /**
   * List inquiries
   */
  listInquiries(
    page: number = 1,
    limit: number = 10,
    filters?: { inquiryType?: string; status?: string; search?: string }
  ): Observable<InquiriesListResponse> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());
    if (filters?.inquiryType) params = params.set('inquiryType', filters.inquiryType);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    return this.apiService.get<InquiriesListResponse>('/super-admin/inquiries', params);
  }

  /**
   * Update inquiry status
   */
  updateInquiryStatus(id: string, status: string): Observable<{ message: string; data: InquiryItem }> {
    return this.apiService.patch<{ message: string; data: InquiryItem }>(`/super-admin/inquiries/${id}/status`, {
      status
    });
  }

  /**
   * Reply to inquiry
   */
  replyInquiry(id: string, message: string): Observable<{ message: string; data: InquiryItem }> {
    return this.apiService.post<{ message: string; data: InquiryItem }>(`/super-admin/inquiries/${id}/reply`, {
      message
    });
  }

  /**
   * List service requests
   */
  listServiceRequests(
    page: number = 1,
    limit: number = 10,
    filters?: { serviceType?: string; status?: string; search?: string }
  ): Observable<ServiceRequestsListResponse> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());
    if (filters?.serviceType) params = params.set('serviceType', filters.serviceType);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    return this.apiService.get<ServiceRequestsListResponse>('/super-admin/service-requests', params);
  }

  /**
   * Update service request status
   */
  updateServiceRequestStatus(id: string, status: string): Observable<{ message: string; data: ServiceRequestItem }> {
    return this.apiService.patch<{ message: string; data: ServiceRequestItem }>(
      `/super-admin/service-requests/${id}/status`,
      { status }
    );
  }

  /**
   * List orders
   */
  listOrders(
    page: number = 1,
    limit: number = 10,
    filters?: { orderType?: string; status?: string; paymentStatus?: string; search?: string }
  ): Observable<OrdersListResponse> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());
    if (filters?.orderType) params = params.set('orderType', filters.orderType);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.paymentStatus) params = params.set('paymentStatus', filters.paymentStatus);
    if (filters?.search) params = params.set('search', filters.search);
    return this.apiService.get<OrdersListResponse>('/super-admin/orders', params);
  }

  /**
   * Update order status
   */
  updateOrderStatus(
    id: string,
    data: { status?: string; paymentStatus?: string; orderStatus?: string }
  ): Observable<{ message: string; data: OrderItem }> {
    return this.apiService.patch<{ message: string; data: OrderItem }>(`/super-admin/orders/${id}/status`, data);
  }
}


