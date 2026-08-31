import { authGuard } from './core/guards/auth.guard';
import { maintenanceGuard } from './core/guards/maintenance.guard';
import { roleGuard } from './core/guards/role.guard';
import { routes } from './app.routes';

describe('staff portal registrations', () => {
  it('guards the Manager portal with the backend-compatible roles', () => {
    const route = routes.find((candidate) => candidate.path === 'manager');

    expect(route?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(route?.data?.['roles']).toEqual(['MANAGER', 'SUPER_ADMIN']);
    expect(route?.loadChildren).toBeDefined();
  });

  it('guards the Inventory Manager portal with the backend-compatible roles', () => {
    const route = routes.find((candidate) => candidate.path === 'inventory-manager');

    expect(route?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(route?.data?.['roles']).toEqual(['INVENTORY', 'SUPER_ADMIN']);
    expect(route?.loadChildren).toBeDefined();
  });

  it('registers both portals before the empty Technician shell and the global wildcard', () => {
    const managerIndex = routes.findIndex((route) => route.path === 'manager');
    const inventoryIndex = routes.findIndex((route) => route.path === 'inventory-manager');
    const technicianShellIndex = routes.findIndex(
      (route) => route.path === '' && route.component && !route.pathMatch,
    );
    const wildcardIndex = routes.findIndex((route) => route.path === '**');

    expect(managerIndex).toBeGreaterThan(-1);
    expect(inventoryIndex).toBeGreaterThan(-1);
    expect(managerIndex).toBeLessThan(technicianShellIndex);
    expect(inventoryIndex).toBeLessThan(technicianShellIndex);
    expect(managerIndex).toBeLessThan(wildcardIndex);
    expect(inventoryIndex).toBeLessThan(wildcardIndex);
  });
});
