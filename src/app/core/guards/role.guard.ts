import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { roleHomeUrl } from '../routing/role-home';

/**
 * Route Guard: Checks if user has required roles and team assignments.
 * If unauthorized, redirects logged-in users back to their own dashboard
 * or unauthenticated users to /login.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = (route.data['roles'] || route.parent?.data['roles']) as string[] | undefined;
  const requiredTeam = (route.data['team'] || route.parent?.data['team']) as string | undefined;

  const user = authService.getCurrentUser();

  if (!user || !authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Check role authorization
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      console.warn(`Access denied to ${state.url}. Required roles: ${requiredRoles.join(', ')}. User role: ${user.role}`);
      const homeUrl = roleHomeUrl(user.role, user);
      return router.parseUrl(homeUrl);
    }
  }

  // Check team assignment for Service Team members (SUPER_ADMIN is exempt)
  if (requiredTeam && user.role === 'SERVICE_TEAM') {
    const isTeamA = Boolean(user.fullName?.includes('Supun Silva') || user.fullName?.includes('A'));
    const isTeamB = Boolean(user.fullName?.includes('Nuwan Jayewardene') || user.fullName?.includes('Nuwan Jayawardene') || user.fullName?.includes('B'));

    if (requiredTeam === 'A' && isTeamB && !isTeamA) {
      console.warn(`Access denied: Service Team B user attempted to access Team A route.`);
      return router.parseUrl('/service-team-b/dashboard');
    }

    if (requiredTeam === 'B' && isTeamA && !isTeamB) {
      console.warn(`Access denied: Service Team A user attempted to access Team B route.`);
      return router.parseUrl('/service-team-a/dashboard');
    }
  }

  return true;
};
