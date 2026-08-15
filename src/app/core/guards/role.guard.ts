import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route Guard: Checks if user has required roles
 * Usage in routes:
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['MANAGER'] }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;

  // If no required roles defined, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const user = authService.getCurrentUser();

  if (user && requiredRoles.includes(user.role)) {
    return true;
  }

  // User doesn't have required role - redirect to home
  console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
  return router.createUrlTree(['/']);
};
