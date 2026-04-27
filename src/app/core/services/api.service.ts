import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Service: Base HTTP wrapper for all API calls
 * Provides centralized API configuration and base URL management
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiBaseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T = any>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.apiBaseUrl}${endpoint}`, { params });
  }

  /**
   * POST request
   */
  post<T = any>(endpoint: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.apiBaseUrl}${endpoint}`, body);
  }

  /**
   * PUT request
   */
  put<T = any>(endpoint: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.apiBaseUrl}${endpoint}`, body);
  }

  /**
   * PATCH request
   */
  patch<T = any>(endpoint: string, body: any = {}): Observable<T> {
    return this.http.patch<T>(`${this.apiBaseUrl}${endpoint}`, body);
  }

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiBaseUrl}${endpoint}`);
  }

  /**
   * Get full API URL
   */
  getFullUrl(endpoint: string): string {
    return `${this.apiBaseUrl}${endpoint}`;
  }
}
