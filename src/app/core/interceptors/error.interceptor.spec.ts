import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor 503 handling', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<Pick<AuthService, 'getCurrentUser' | 'logout'>>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    authService.getCurrentUser.and.returnValue({ role: 'INVENTORY' } as any);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function flush503(body: Record<string, unknown>): Promise<number> {
    return new Promise((resolve) => {
      http.get('/api/inventory/dashboard').subscribe({
        next: () => fail('expected the request to error'),
        error: (error) => resolve(error.status),
      });
      httpMock
        .expectOne('/api/inventory/dashboard')
        .flush(body, { status: 503, statusText: 'Service Unavailable' });
    });
  }

  it('ends the session when the system is genuinely under maintenance', async () => {
    await flush503({ success: false, message: 'System is under maintenance', maintenance: { isActive: true } });

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('keeps a SUPER_ADMIN signed in during maintenance', async () => {
    authService.getCurrentUser.and.returnValue({ role: 'SUPER_ADMIN' } as any);

    await flush503({ success: false, message: 'System is under maintenance', maintenance: { isActive: true } });

    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('surfaces an application 503 to the caller without ending the session', async () => {
    const status = await flush503({
      code: 'INVENTORY_DASHBOARD_UNAVAILABLE',
      message: 'Inventory dashboard is currently unavailable',
    });

    expect(status).toBe(503);
    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
