import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MaintenanceService } from '../services/maintenance.service';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const maintenanceGuard: CanActivateFn = (route, state) => {
  const maintenanceService = inject(MaintenanceService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if system is under maintenance
  const isUnderMaintenance = maintenanceService.isMaintenanceActiveSyncGetter();

  if (isUnderMaintenance) {
    // Check if user is SUPER_ADMIN - allow bypass
    const currentUser = authService.getCurrentUser();
    if (currentUser?.role === 'SUPER_ADMIN') {
      return true;
    }

    // Not SUPER_ADMIN - redirect to maintenance page
    router.navigate(['/maintenance']);
    return false;
  }

  // Not under maintenance - allow access
  return true;
};
