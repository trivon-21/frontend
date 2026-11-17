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

  it('guards the Technician portal', () => {
    const route = routes.find((r) => r.path === '' && r.component && !r.pathMatch);
    expect(route?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(route?.data?.['roles']).toEqual(['MAIN_TECH', 'SUPER_ADMIN']);
  });

  it('guards the Service Team portals', () => {
    const teamA = routes.find((r) => r.path === 'service-team-a');
    expect(teamA?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(teamA?.data?.['roles']).toEqual(['SERVICE_TEAM', 'SUPER_ADMIN']);
    expect(teamA?.data?.['team']).toEqual('A');

    const teamB = routes.find((r) => r.path === 'service-team-b');
    expect(teamB?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(teamB?.data?.['roles']).toEqual(['SERVICE_TEAM', 'SUPER_ADMIN']);
    expect(teamB?.data?.['team']).toEqual('B');

    const genericTeam = routes.find((r) => r.path === 'service-team');
    expect(genericTeam?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(genericTeam?.data?.['roles']).toEqual(['SERVICE_TEAM', 'SUPER_ADMIN']);
  });

  it('guards Customer Dashboard', () => {
    const route = routes.find((r) => r.path === 'dashboard');
    expect(route?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(route?.data?.['roles']).toEqual(['CUSTOMER', 'SUPER_ADMIN']);
  });

  it('guards Finance portal', () => {
    const route = routes.find((r) => r.path === 'finance');
    expect(route?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(route?.data?.['roles']).toEqual(['FINANCE', 'SUPER_ADMIN']);
  });

  it('guards Inspection Officer portal', () => {
    const route = routes.find((r) => r.path === 'inspection-officer');
    expect(route?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(route?.data?.['roles']).toEqual(['INSPECTION', 'SUPER_ADMIN']);
  });

  it('guards CSA portal', () => {
    const route = routes.find((r) => r.path === 'csa');
    expect(route?.canActivate).toEqual([authGuard, maintenanceGuard, roleGuard]);
    expect(route?.data?.['roles']).toEqual(['CSA', 'SUPER_ADMIN']);
  });
});
