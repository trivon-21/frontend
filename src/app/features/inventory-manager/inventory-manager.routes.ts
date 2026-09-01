import { Routes } from '@angular/router';
import { InventoryManagerLayoutComponent } from './components/layout/inventory-manager-layout/inventory-manager-layout.component';
import { ActivityLogComponent } from './pages/activity-log/activity-log.component';
import { AssetManagementDashboardComponent } from './pages/asset-management/asset-management.component';
import { InventoryManagerDashboardComponent } from './pages/dashboard/inventory-manager-dashboard.component';
import { DispatchLogisticsDashboardComponent } from './pages/dispatch-logistics/dispatch-logistics.component';
import { InventoryListComponent } from './pages/inventory/inventory-list.component';
import { MaterialRequestsDashboardComponent } from './pages/material-requests/material-requests.component';
import { NewOrderFormComponent } from './pages/order-creation/new-order-form/new-order-form.component';
import { OrderCreationComponent } from './pages/order-creation/order-creation.component';
import { ProcurementDashboardComponent } from './pages/procurement/procurement.component';
import { ProductWizardComponent } from './pages/product-wizard/product-wizard.component';
import { ReturnsRmaDashboardComponent } from './pages/returns-rma/returns-rma.component';

export const INVENTORY_MANAGER_ROUTES: Routes = [
  {
    path: '',
    component: InventoryManagerLayoutComponent,
    children: [
      { path: '', component: InventoryManagerDashboardComponent, pathMatch: 'full' },
      { path: 'inventory', component: InventoryListComponent },
      { path: 'product-wizard/:id', component: ProductWizardComponent },
      { path: 'product-wizard', component: ProductWizardComponent },
      { path: 'asset-management', component: AssetManagementDashboardComponent },
      { path: 'material-requests', component: MaterialRequestsDashboardComponent },
      { path: 'dispatch-logistics', component: DispatchLogisticsDashboardComponent },
      { path: 'order-creation/new', component: NewOrderFormComponent },
      { path: 'order-creation/edit/:id', component: NewOrderFormComponent },
      { path: 'order-creation', component: OrderCreationComponent },
      { path: 'procurement', component: ProcurementDashboardComponent },
      { path: 'returns-rma', component: ReturnsRmaDashboardComponent },
      { path: 'activity-log', component: ActivityLogComponent },
      { path: '**', redirectTo: '/inventory-manager' },
    ],
  },
];
