export function roleHomeUrl(role: string | null | undefined, user?: any): string {
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
      if (user?.fullName?.includes('Supun Silva') || user?.fullName?.includes('A')) {
        return '/service-team-a/dashboard';
      }
      if (user?.fullName?.includes('Nuwan Jayewardene') || user?.fullName?.includes('Nuwan Jayawardene') || user?.fullName?.includes('B')) {
        return '/service-team-b/dashboard';
      }
      return '/service-team/dashboard';
    case 'FINANCE':
      return '/finance/dashboard';
    case 'INSPECTION':
      return '/inspection-officer/dashboard';
    default:
      return '/';
  }
}
