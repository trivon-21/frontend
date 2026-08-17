import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

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
        redirectTo: 'catalog-health',
        pathMatch: 'full',
      },
      {
        path: 'data-quality',
        redirectTo: 'catalog-health',
        pathMatch: 'full',
      },
      {
        path: 'catalog-health',
        loadComponent: () => import('./features/inventory-manager/pages/list-items/list-items.component').then((m) => m.ListItemsComponent),
      },
      {
        path: 'product-wizard',
        loadComponent: () =>
          import('./features/inventory-manager/pages/product-wizard/product-wizard.component').then(
            (m) => m.ProductWizardComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'product-wizard/:id',
        loadComponent: () =>
          import('./features/inventory-manager/pages/product-wizard/product-wizard.component').then(
            (m) => m.ProductWizardComponent,
          ),
        canDeactivate: [pendingChangesGuard],
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
        redirectTo: 'tickets',
        pathMatch: 'full',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/manager/pages/orders/orders.component').then(
            (m) => m.OrdersComponent,
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/manager/pages/tickets/tickets.component').then(
            (m) => m.TicketsComponent,
          ),
      },
      {
        path: 'customers',
        redirectTo: 'tickets',
        pathMatch: 'full',
      },
      {
        path: 'analytics',
        children: [
          {
            path: '',
            redirectTo: 'period-performance',
            pathMatch: 'full',
          },
          {
            path: 'period-performance',
            data: { analyticsSection: 'performance' },
            loadComponent: () => import('./features/manager/pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
          },
          {
            path: 'service-operations',
            data: { analyticsSection: 'service' },
            loadComponent: () => import('./features/manager/pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
          },
          {
            path: 'purchasing-approvals',
            data: { analyticsSection: 'purchasing' },
            loadComponent: () => import('./features/manager/pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
          },
          {
            path: 'inventory-exception-control',
            data: { analyticsSection: 'inventory' },
            loadComponent: () => import('./features/manager/pages/analytics/analytics.component').then((m) => m.AnalyticsComponent),
          },
        ],
      },
      {
        path: 'notifications',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];
