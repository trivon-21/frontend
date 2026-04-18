import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/customer/components/layout/customer-layout/customer-layout.component').then(
        (m) => m.CustomerLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/customer/pages/dashboard/customer-dashboard-home.component').then(
            (m) => m.CustomerDashboardHomeComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/customer/pages/orders/customer-orders.component').then(
            (m) => m.CustomerOrdersComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/customer/pages/settings/notification-settings.component').then(
            (m) => m.NotificationSettingsComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/customer/pages/notifications/notifications.component').then(
            (m) => m.NotificationsPageComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/customer/pages/profile/customer-profile.component').then(
            (m) => m.CustomerProfileComponent
          ),
      },
    ],
  },
];