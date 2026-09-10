import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor: Handles HTTP errors centrally
 * - 401: Token expired/invalid → logout and redirect to login
 * - 403: Access denied
 * - 503: Service unavailable (maintenance) → logout with alert
 * - 500: Server errors
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);

      if (error.status === 401) {
        // Unauthorized - token expired or invalid
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Access denied. Insufficient permissions.');
        router.navigate(['/']);
      } else if (error.status === 503) {
        // Service Unavailable - system under maintenance
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
          authService.logout();
          router.navigate(['/login']);
        }
      } else if (error.status === 0) {
        // Network error or CORS issue
        console.error('Network error. Please check your connection.');
      }

      return throwError(() => error);
    })
  );
};
