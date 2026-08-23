import { roleHomeUrl } from './role-home';

describe('roleHomeUrl', () => {
  it('routes the two integrated staff roles to their portals', () => {
    expect(roleHomeUrl('MANAGER')).toBe('/manager');
    expect(roleHomeUrl('INVENTORY')).toBe('/inventory-manager');
  });

  it('preserves the super-admin route and the existing fallback', () => {
    expect(roleHomeUrl('SUPER_ADMIN')).toBe('/super-admin');
    expect(roleHomeUrl('CUSTOMER')).toBe('/dashboard');
    expect(roleHomeUrl('FINANCE')).toBe('/dashboard');
    expect(roleHomeUrl(undefined)).toBe('/dashboard');
  });
});
