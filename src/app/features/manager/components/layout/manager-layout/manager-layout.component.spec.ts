import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { ManagerLayoutComponent } from './manager-layout.component';

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('ManagerLayoutComponent presentation contract', () => {
  let fixture: ComponentFixture<ManagerLayoutComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'logout']);
    authService.getCurrentUser.and.returnValue({
      id: 'manager-1',
      fullName: 'Morgan Reed',
      email: 'manager@example.test',
      role: 'MANAGER',
    });

    await TestBed.configureTestingModule({
      imports: [ManagerLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([
          { path: 'manager', component: EmptyRouteComponent },
          { path: 'manager/orders', component: EmptyRouteComponent },
          { path: 'manager/work-items', component: EmptyRouteComponent },
          { path: 'manager/analytics/period-performance', component: EmptyRouteComponent },
          { path: 'login', component: EmptyRouteComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ManagerLayoutComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('retains the canonical Manager navigation destinations', () => {
    const root = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('.sidebar-nav > a.nav-item, .analytics-nav-row a'),
      (anchor) => anchor.getAttribute('href'),
    );

    expect(hrefs).toEqual([
      '/manager',
      '/manager/orders',
      '/manager/work-items',
      '/manager/analytics/period-performance',
    ]);
  });

  it('exposes the analytics submenu through an expanded-state relationship', () => {
    const root = fixture.nativeElement as HTMLElement;
    const toggle = root.querySelector<HTMLButtonElement>('.analytics-toggle')!;
    expect(toggle.getAttribute('aria-controls')).toBe('manager-analytics-submenu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();

    const submenu = root.querySelector<HTMLElement>('#manager-analytics-submenu')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(submenu).not.toBeNull();
    expect(submenu.querySelectorAll('a').length).toBe(4);
  });

  it('connects the avatar to its menu and keeps the Manager logout behavior', async () => {
    const root = fixture.nativeElement as HTMLElement;
    const avatar = root.querySelector<HTMLButtonElement>('.user-avatar')!;
    expect(avatar.getAttribute('aria-controls')).toBe('manager-user-menu');
    expect(avatar.getAttribute('aria-haspopup')).toBe('menu');
    expect(avatar.getAttribute('aria-expanded')).toBe('false');

    avatar.click();
    fixture.detectChanges();
    expect(avatar.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#manager-user-menu')).not.toBeNull();

    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.debugElement.query(By.css('.menu-item.logout')).triggerEventHandler('click');
    await fixture.whenStable();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
