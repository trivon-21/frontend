import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'inventory-manager',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inventory-manager/components/layout/inventory-manager-layout/inventory-manager-layout.component').then(
        (m) => m.InventoryManagerLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/inventory-manager/pages/dashboard/inventory-manager-dashboard.component').then(
            (m) => m.InventoryManagerDashboardComponent,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory-manager/pages/inventory/inventory-list.component').then(
            (m) => m.InventoryListComponent,
          ),
      },
      {
        path: 'list-items',
        loadComponent: () =>
          import('./features/inventory-manager/pages/list-items/list-items.component').then(
            (m) => m.ListItemsComponent,
          ),
      },
      {
        path: 'product-wizard',
        loadComponent: () =>
          import('./features/inventory-manager/pages/product-wizard/product-wizard.component').then(
            (m) => m.ProductWizardComponent,
          ),
      },
      {
        path: 'product-wizard/:id',
        loadComponent: () =>
          import('./features/inventory-manager/pages/product-wizard/product-wizard.component').then(
            (m) => m.ProductWizardComponent,
          ),
      },
      {
        path: 'asset-management',
        loadComponent: () =>
          import(
            './features/inventory-manager/pages/asset-management/asset-management.component'
          ).then((m) => m.AssetManagementDashboardComponent),
      },
      {
        path: 'material-requests',
        loadComponent: () =>
          import(
            './features/inventory-manager/pages/material-requests/material-requests.component'
          ).then((m) => m.MaterialRequestsDashboardComponent),
      },
      {
        path: 'dispatch-logistics',
        loadComponent: () =>
          import(
            './features/inventory-manager/pages/dispatch-logistics/dispatch-logistics.component'
          ).then((m) => m.DispatchLogisticsDashboardComponent),
      },
      {
        path: 'returns-rma',
        loadComponent: () =>
          import('./features/inventory-manager/pages/returns-rma/returns-rma.component').then(
            (m) => m.ReturnsRmaDashboardComponent,
          ),
      },
      {
        path: 'order-creation',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/inventory-manager/pages/order-creation/order-creation.component').then(
                (m) => m.OrderCreationComponent,
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/inventory-manager/pages/order-creation/new-order-form/new-order-form.component').then(
                (m) => m.NewOrderFormComponent,
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./features/inventory-manager/pages/order-creation/new-order-form/new-order-form.component').then(
                (m) => m.NewOrderFormComponent,
              ),
          }
        ]
      },
      {
        path: 'procurement',
        loadComponent: () =>
          import('./features/inventory-manager/pages/procurement/procurement.component').then(
            (m) => m.ProcurementDashboardComponent,
          ),
      },
      {
        path: 'activity-log',
        loadComponent: () =>
          import('./features/inventory-manager/pages/activity-log/activity-log.component').then(
            (m) => m.ActivityLogComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/inventory-manager/pages/dashboard/inventory-manager-dashboard.component').then(
            (m) => m.InventoryManagerDashboardComponent,
          ),
      },
    ],
  },
  {
    path: 'manager',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER'] },
    loadComponent: () =>
      import('./features/manager/components/layout/manager-layout/manager-layout.component').then(
        (m) => m.ManagerLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'vehicle-assignment',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/manager/pages/dashboard/manager-dashboard.component').then(
            (m) => m.ManagerDashboardComponent,
          ),
      },
    ],
  },
];


// Force reload for Returns & RMA implementation
