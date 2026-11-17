import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { InventoryManagerLayoutComponent } from './inventory-manager-layout.component';

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('InventoryManagerLayoutComponent presentation contract', () => {
  let fixture: ComponentFixture<InventoryManagerLayoutComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'logout']);
    authService.getCurrentUser.and.returnValue({
      id: 'inventory-1',
      fullName: 'Ishara Perera',
      email: 'inventory@example.test',
      role: 'INVENTORY',
    });

    await TestBed.configureTestingModule({
      imports: [InventoryManagerLayoutComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([
          { path: 'inventory-manager', component: EmptyRouteComponent },
          { path: 'inventory-manager/inventory', component: EmptyRouteComponent },
          { path: 'inventory-manager/asset-management', component: EmptyRouteComponent },
          { path: 'inventory-manager/material-requests', component: EmptyRouteComponent },
          { path: 'inventory-manager/dispatch-logistics', component: EmptyRouteComponent },
          { path: 'inventory-manager/order-creation', component: EmptyRouteComponent },
          { path: 'inventory-manager/procurement', component: EmptyRouteComponent },
          { path: 'inventory-manager/returns-rma', component: EmptyRouteComponent },
          { path: 'login', component: EmptyRouteComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(InventoryManagerLayoutComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('retains the eight canonical Inventory Manager navigation destinations', () => {
    const root = fixture.nativeElement as HTMLElement;
    const anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>('.sidebar-nav > a.nav-item'));

    expect(anchors.map((anchor) => anchor.getAttribute('href'))).toEqual([
      '/inventory-manager',
      '/inventory-manager/inventory',
      '/inventory-manager/asset-management',
      '/inventory-manager/material-requests',
      '/inventory-manager/dispatch-logistics',
      '/inventory-manager/order-creation',
      '/inventory-manager/procurement',
      '/inventory-manager/returns-rma',
    ]);
  });

  it('connects the avatar to its menu and preserves logout', async () => {
    const root = fixture.nativeElement as HTMLElement;
    const avatar = root.querySelector<HTMLButtonElement>('.user-avatar')!;
    expect(avatar.getAttribute('aria-controls')).toBe('inventory-manager-user-menu');
    expect(avatar.getAttribute('aria-haspopup')).toBe('menu');
    expect(avatar.getAttribute('aria-expanded')).toBe('false');

    avatar.click();
    fixture.detectChanges();
    expect(avatar.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('#inventory-manager-user-menu')).not.toBeNull();

    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.debugElement.query(By.css('.menu-item.logout')).triggerEventHandler('click');
    await fixture.whenStable();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('places the live clock immediately before the user menu', () => {
    const root = fixture.nativeElement as HTMLElement;
    const actions = root.querySelector('.header-actions')!;

    expect(actions.children[0].tagName.toLowerCase()).toBe('app-header-clock');
    expect(actions.children[1].classList.contains('user-menu-container')).toBeTrue();
  });
});
