export function roleHomeUrl(role: string | null | undefined): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin';
    case 'MANAGER':
      return '/manager';
    case 'INVENTORY':
      return '/inventory-manager';
    default:
      return '/dashboard';
  }
}
