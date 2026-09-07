import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'isLoggedIn']);
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree', 'parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  function executeGuard(routeData: any, url = '/protected'): boolean | any {
    const route = { data: routeData } as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, state));
  }

  it('redirects unauthenticated user to login', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockAuthService.getCurrentUser.and.returnValue(null);
    mockRouter.createUrlTree.and.returnValue('/login?returnUrl=%2Fprotected' as any);

    const result = executeGuard({ roles: ['CUSTOMER'] });
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/protected' }
    });
    expect(result).toBe('/login?returnUrl=%2Fprotected' as any);
  });

  it('allows access when user has the required role', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue({
      id: '1',
      fullName: 'John Customer',
      role: 'CUSTOMER'
    });

    const result = executeGuard({ roles: ['CUSTOMER', 'SUPER_ADMIN'] });
    expect(result).toBeTrue();
  });

  it('redirects unauthorized user to their role home dashboard', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue({
      id: '2',
      fullName: 'Jane Customer',
      role: 'CUSTOMER'
    });
    mockRouter.parseUrl.and.returnValue('/dashboard' as any);

    const result = executeGuard({ roles: ['FINANCE', 'SUPER_ADMIN'] }, '/finance/dashboard');
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/dashboard');
    expect(result).toBe('/dashboard' as any);
  });

  it('redirects finance officer trying to access super-admin to finance dashboard', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue({
      id: '3',
      fullName: 'Sam Finance',
      role: 'FINANCE'
    });
    mockRouter.parseUrl.and.returnValue('/finance/dashboard' as any);

    const result = executeGuard({ roles: ['SUPER_ADMIN'] }, '/super-admin');
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/finance/dashboard');
    expect(result).toBe('/finance/dashboard' as any);
  });

  it('blocks Service Team B member from accessing Team A portal', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue({
      id: '4',
      fullName: 'Nuwan Jayewardene (Team B)',
      role: 'SERVICE_TEAM'
    });
    mockRouter.parseUrl.and.returnValue('/service-team-b/dashboard' as any);

    const result = executeGuard({ roles: ['SERVICE_TEAM', 'SUPER_ADMIN'], team: 'A' }, '/service-team-a/dashboard');
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/service-team-b/dashboard');
    expect(result).toBe('/service-team-b/dashboard' as any);
  });

  it('blocks Service Team A member from accessing Team B portal', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue({
      id: '5',
      fullName: 'Supun Silva (Team A)',
      role: 'SERVICE_TEAM'
    });
    mockRouter.parseUrl.and.returnValue('/service-team-a/dashboard' as any);

    const result = executeGuard({ roles: ['SERVICE_TEAM', 'SUPER_ADMIN'], team: 'B' }, '/service-team-b/dashboard');
    expect(mockRouter.parseUrl).toHaveBeenCalledWith('/service-team-a/dashboard');
    expect(result).toBe('/service-team-a/dashboard' as any);
  });
});
