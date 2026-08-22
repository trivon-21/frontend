import { environment } from '../../../environments/environment';

export type LocalDevRole = 'INVENTORY' | 'MANAGER';

export interface LocalDevUser {
  id: string;
  fullName: string;
  email: string;
  role: LocalDevRole;
}

const LOCAL_AUTH_ROLE_KEY = 'airlux.localAuthRole';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const LOCAL_DEV_USERS: Record<LocalDevRole, LocalDevUser> = {
  INVENTORY: {
    id: '000000000000000000000001',
    fullName: 'Dev Inventory User',
    email: 'inventory.dev@local',
    role: 'INVENTORY',
  },
  MANAGER: {
    id: '000000000000000000000002',
    fullName: 'Dev Manager User',
    email: 'manager.dev@local',
    role: 'MANAGER',
  },
};

export function isLocalAuthBypassEnabled(): boolean {
  return environment.localAuthBypass && LOCAL_HOSTS.has(window.location.hostname);
}

export function getLocalDevRole(): LocalDevRole {
  return localStorage.getItem(LOCAL_AUTH_ROLE_KEY) === 'MANAGER' ? 'MANAGER' : 'INVENTORY';
}

export function setLocalDevRole(role: LocalDevRole): void {
  localStorage.setItem(LOCAL_AUTH_ROLE_KEY, role);
}

export function getLocalDevUser(role = getLocalDevRole()): LocalDevUser {
  return { ...LOCAL_DEV_USERS[role] };
}

export function getLocalDevHomeRoute(role = getLocalDevRole()): string {
  return role === 'MANAGER' ? '/manager' : '/inventory-manager';
}
