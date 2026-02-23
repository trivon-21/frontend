import { Routes } from '@angular/router';

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
    path: 'dashboard',
    loadComponent: () =>
      import('./components/customer-layout/customer-layout.component').then(
        (m) => m.CustomerLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/customer-dashboard-home/customer-dashboard-home.component').then(
            (m) => m.CustomerDashboardHomeComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/customer-orders/customer-orders.component').then(
            (m) => m.CustomerOrdersComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/customer-profile/customer-profile.component').then(
            (m) => m.CustomerProfileComponent
          ),
      },
    ],
  },
];