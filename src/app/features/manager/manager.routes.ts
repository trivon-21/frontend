import { Routes } from '@angular/router';
import { ManagerLayoutComponent } from './components/layout/manager-layout/manager-layout.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ManagerDashboardComponent } from './pages/dashboard/manager-dashboard.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { TicketsComponent } from './pages/tickets/tickets.component';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      { path: '', component: ManagerDashboardComponent, pathMatch: 'full' },
      { path: 'dashboard', redirectTo: '', pathMatch: 'full' },
      { path: 'orders', component: OrdersComponent },
      { path: 'work-items', component: TicketsComponent },
      // Component alias preserves query parameters from legacy dashboard links and bookmarks.
      { path: 'tickets', component: TicketsComponent },
      {
        path: 'analytics',
        redirectTo: 'analytics/period-performance',
        pathMatch: 'full',
      },
      {
        path: 'analytics/period-performance',
        component: AnalyticsComponent,
        data: { analyticsSection: 'performance' },
      },
      {
        path: 'analytics/service-operations',
        component: AnalyticsComponent,
        data: { analyticsSection: 'service' },
      },
      {
        path: 'analytics/purchasing-approvals',
        component: AnalyticsComponent,
        data: { analyticsSection: 'purchasing' },
      },
      {
        path: 'analytics/inventory-exception-control',
        component: AnalyticsComponent,
        data: { analyticsSection: 'inventory' },
      },
      { path: '**', redirectTo: '/manager' },
    ],
  },
];
