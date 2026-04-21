export type UserRole =
  | 'SUPER_ADMIN'
  | 'CUSTOMER'
  | 'CSA'
  | 'INSPECTION'
  | 'MAIN_TECH'
  | 'SERVICE_TEAM'
  | 'FINANCE'
  | 'INVENTORY'
  | 'MANAGER';

export interface AuthUser {
  _id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role: UserRole;
  avatar?: string;
  isActive?: boolean;
  createdAt?: Date;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  expiresIn?: number;
}

export interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export interface SignupPayload {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  authMethod: 'email' | 'phone';
  otp?: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
