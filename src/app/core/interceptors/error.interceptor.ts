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
 * - 500: Server errors
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);

      // Local development uses a synthetic role so the Manager and Inventory
      // screens can be reviewed without creating a real authenticated session.
      // Their API calls can still receive 401/403 responses from a backend that
      // has its development bypass disabled. Keep the current route in that
      // case so feature-level offline/error handling can render normally.
      if (authService.localAuthBypassEnabled && (error.status === 401 || error.status === 403)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        // Unauthorized - token expired or invalid
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Access denied. Insufficient permissions.');
        router.navigate(['/']);
      } else if (error.status === 0) {
        // Network error or CORS issue
        console.error('Network error. Please check your connection.');
      }

      return throwError(() => error);
    })
  );
};
