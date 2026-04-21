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
}
