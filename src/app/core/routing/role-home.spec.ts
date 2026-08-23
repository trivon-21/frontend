import { roleHomeUrl } from './role-home';

describe('roleHomeUrl', () => {
  it('routes the two integrated staff roles to their portals', () => {
    expect(roleHomeUrl('MANAGER')).toBe('/manager');
    expect(roleHomeUrl('INVENTORY')).toBe('/inventory-manager');
  });

  it('preserves every existing role-specific destination', () => {
    expect(roleHomeUrl('SUPER_ADMIN')).toBe('/super-admin');
    expect(roleHomeUrl('CUSTOMER')).toBe('/dashboard');
    expect(roleHomeUrl('MAIN_TECH')).toBe('/main-technician-dashboard');
    expect(roleHomeUrl('SERVICE_TEAM')).toBe('/service-team/dashboard');
    expect(roleHomeUrl('FINANCE')).toBe('/finance/dashboard');
    expect(roleHomeUrl('INSPECTION')).toBe('/inspection-officer/dashboard');
  });

  it('routes missing and unsupported roles to the public home page', () => {
    expect(roleHomeUrl(undefined)).toBe('/');
    expect(roleHomeUrl(null)).toBe('/');
    expect(roleHomeUrl('CSA')).toBe('/');
  });
});
