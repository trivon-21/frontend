export function roleHomeUrl(role: string | null | undefined): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin';
    case 'MANAGER':
      return '/manager';
    case 'INVENTORY':
      return '/inventory-manager';
    case 'CUSTOMER':
      return '/dashboard';
    case 'MAIN_TECH':
      return '/main-technician-dashboard';
    case 'SERVICE_TEAM':
      return '/service-team/dashboard';
    case 'FINANCE':
      return '/finance/dashboard';
    case 'INSPECTION':
      return '/inspection-officer/dashboard';
    default:
      return '/';
  }
}
