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
}
