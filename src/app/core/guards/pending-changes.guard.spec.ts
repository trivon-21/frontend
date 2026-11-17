import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HasPendingChanges, pendingChangesGuard } from './pending-changes.guard';

describe('pendingChangesGuard', () => {
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  it('allows deactivation when component canDeactivate returns true', () => {
    const component: HasPendingChanges = {
      canDeactivate: () => true,
    };

    const result = TestBed.runInInjectionContext(() =>
      pendingChangesGuard(component, dummyRoute, dummyState, dummyState),
    );

    expect(result).toBeTrue();
  });

  it('blocks deactivation when component canDeactivate returns false', () => {
    const component: HasPendingChanges = {
      canDeactivate: () => false,
    };

    const result = TestBed.runInInjectionContext(() =>
      pendingChangesGuard(component, dummyRoute, dummyState, dummyState),
    );

    expect(result).toBeFalse();
  });
});
