import { Routes } from '@angular/router';
import { LayoutComponent as TechnicianLayoutComponent } from './features/technician/components/layout/layout.component';
import { LayoutComponent as ServiceTeamLayoutComponent } from './features/service-team/components/layout/layout.component';
import { ServiceTeamDashboardComponent } from './features/service-team/pages/service-team-dashboard/service-team-dashboard.component';
import { ServiceTeamAssignedJobsComponent } from './features/service-team/pages/service-team-assigned-jobs/service-team-assigned-jobs.component';
import { ServiceTeamTeamDetailsComponent } from './features/service-team/pages/service-team-team-details/service-team-team-details.component';
import { ServiceTeamServiceDetailsComponent } from './features/service-team/pages/service-team-service-details/service-team-service-details.component';
import { ServiceTeamServiceHistoryComponent } from './features/service-team/pages/service-team-service-history/service-team-service-history.component';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';




// Product / Customer
import { Catalog } from './features/product/catalog/catalog';
import { ProductDetail } from './features/product/pages/product-detail';
import { Cart } from './features/cart/pages/cart';
import { Checkout } from './features/cart/checkout/checkout';
import { OrderSuccess } from './features/cart/order-success/order-success';
import { BuyInstall } from './features/product/buy-install/buy-install';
import { BankSettings } from './features/admin/bank-settings/bank-settings';
import { ConsultationBridge } from './features/consultation-bridge/consultation-bridge';

// Authentication / Guards
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { maintenanceGuard } from './core/guards/maintenance.guard';

// Finance
import { FinanceLayoutComponent } from './features/finance/layout/finance-layout/finance-layout.component';
import { DashboardComponent } from './features/finance/pages/dashboard/dashboard.component';
import { PaymentVerificationComponent } from './features/finance/pages/payment-verification/payment-verification.component';
import { VerifiedPaymentsComponent } from './features/finance/pages/verified-payments/verified-payments.component';
import { RejectedPaymentsComponent } from './features/finance/pages/rejected-payments/rejected-payments.component';
import { InspectionPaymentVerificationComponent } from './features/finance/pages/inspection-payment-verification/inspection-payment-verification.component';
import { InspectionVerifiedPaymentsComponent } from './features/finance/pages/inspection-verified-payments/inspection-verified-payments.component';
import { InspectionRejectedPaymentsComponent } from './features/finance/pages/inspection-rejected-payments/inspection-rejected-payments.component';
import { InvoiceGenerateComponent } from './features/finance/pages/invoice-generate/invoice-generate.component';
import { InvoicePendingComponent } from './features/finance/pages/invoice-pending/invoice-pending.component';
import { InvoiceAcceptedComponent } from './features/finance/pages/invoice-accepted/invoice-accepted.component';
import { InvoiceRejectedComponent } from './features/finance/pages/invoice-rejected/invoice-rejected.component';
import { InvoicePaidComponent } from './features/finance/pages/invoice-paid/invoice-paid.component';
import { InvoiceAutoCancelledComponent } from './features/finance/pages/invoice-auto-cancelled/invoice-auto-cancelled.component';
import { InvoiceDashboardComponent } from './features/finance/pages/invoice-dashboard/invoice-dashboard.component';
import { InvoiceCreatorComponent } from './features/finance/pages/invoice-creator/invoice-creator.component';
import { InvoicePaymentVerificationComponent } from './features/finance/pages/invoice-payment-verification/invoice-payment-verification.component';
import { InvoiceVerifiedPaymentsComponent } from './features/finance/pages/invoice-verified-payments/invoice-verified-payments.component';
import { InvoiceRejectedPaymentsComponent } from './features/finance/pages/invoice-rejected-payments/invoice-rejected-payments.component';
import { ServicePaymentVerificationComponent } from './features/finance/pages/service-payment-verification/service-payment-verification.component';
import { ServiceVerifiedPaymentsComponent } from './features/finance/pages/service-verified-payments/service-verified-payments.component';
import { ServiceRejectedPaymentsComponent } from './features/finance/pages/service-rejected-payments/service-rejected-payments.component';
import { PaymentAuditLogComponent } from './features/finance/pages/payment-audit-log/payment-audit-log.component';
import { FinancialReportComponent } from './features/finance/pages/financial-report/financial-report.component';
import { PurchaseRequestVerificationComponent } from './features/finance/pages/purchase-request-verification/purchase-request-verification.component';
import { PurchaseRequestApprovedComponent } from './features/finance/pages/purchase-request-approved/purchase-request-approved.component';
import { PurchaseRequestRejectedComponent } from './features/finance/pages/purchase-request-rejected/purchase-request-rejected.component';


// Inspection
import { InspectionPaymentComponent } from './features/customer/pages/inspection-payment/inspection-payment.component';
import { InspectionSchedulingComponent } from './features/customer/pages/inspection-scheduling/inspection-scheduling.component';
import { InspectionReportComponent } from './features/customer/pages/inspection-report/inspection-report.component';
import { InspectionLayoutComponent } from './features/inspection-team/layout/inspection-layout/inspection-layout.component';
import { ScheduledInspectionsComponent } from './features/inspection-team/pages/scheduled-inspections/scheduled-inspections.component';
import { OngoingInspectionsComponent } from './features/inspection-team/pages/ongoing-inspections/ongoing-inspections.component';
import { CompletedInspectionsComponent } from './features/inspection-team/pages/completed-inspections/completed-inspections.component';
import { InspectionDashboardComponent } from './features/inspection-team/pages/inspection-dashboard/inspection-dashboard.component';
import { CustomerInvoiceComponent } from './features/customer/pages/customer-invoice/customer-invoice.component';

// CSA (Customer Support Agent)
import { CsaLayoutComponent } from './features/csa/components/layout/csa-layout.component';
import { CsaDashboardComponent } from './features/csa/pages/csa-dashboard/csa-dashboard.component';
import { CsaMaintenanceSchedulesComponent } from './features/csa/pages/csa-maintenance-schedules/csa-maintenance-schedules.component';
import { CsaCustomersComponent } from './features/csa/pages/csa-customers/csa-customers.component';
import { CsaServiceTicketsComponent } from './features/csa/pages/csa-service-tickets/csa-service-tickets.component';
import { CsaInquiriesComponent } from './features/csa/pages/csa-inquiries/csa-inquiries.component';
import { InvoicePaymentUploadComponent } from './features/customer/pages/invoice-payment-upload/invoice-payment-upload.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent, pathMatch: 'full' },

  // ── Manager portal
  {
    path: 'manager',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['MANAGER', 'SUPER_ADMIN'] },
    loadChildren: () =>
      import('./features/manager/manager.routes').then((m) => m.MANAGER_ROUTES),
  },

  // ── Inventory Manager portal
  {
    path: 'inventory-manager',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['INVENTORY', 'SUPER_ADMIN'] },
    loadChildren: () =>
      import('./features/inventory-manager/inventory-manager.routes').then(
        (m) => m.INVENTORY_MANAGER_ROUTES,
      ),
  },

  // ── Technician / Manager portal
  {
    path: '',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['MAIN_TECH', 'SUPER_ADMIN'] },
    component: TechnicianLayoutComponent,
    children: [
      {
        path: 'main-technician-dashboard',
        loadComponent: () => import('./features/technician/pages/main-technician-dashboard/main-technician-dashboard.component').then(m => m.MainTechnicianDashboardComponent),
      },
      {
        path: 'main-technician-inspections',
        loadComponent: () => import('./features/technician/pages/main-technician-inspections/main-technician-inspections.component').then(m => m.MainTechnicianInspectionsComponent),
      },
      {
        path: 'main-technician-inspection-report-review/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-inspection-report-review/main-technician-inspection-report-review.component').then(m => m.MainTechnicianInspectionReportReviewComponent),
      },
      {
        path: 'main-technician-inspection-reports',
        loadComponent: () => import('./features/technician/pages/main-technician-inspection-report/main-technician-inspection-report.component').then(m => m.MainTechnicianInspectionReportsComponent),
      },
      {
        path: 'main-technician-inspection-details/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-inspection-details/main-technician-inspection-details.component').then(m => m.MainTechnicianInspectionDetailsComponent),
      },
      {
        path: 'main-technician-installations',
        loadComponent: () => import('./features/technician/pages/main-technician-installations/main-technician-installations.component').then(m => m.MainTechnicianInstallationsComponent),
      },
      {
        path: 'main-technician-installation-details/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-installation-details/main-technician-installation-details.component').then(m => m.MainTechnicianInstallationDetailsComponent),
      },
      {
        path: 'main-technician-service-requests',
        loadComponent: () => import('./features/technician/pages/main-technician-service-requests/main-technician-service-requests.component').then(m => m.MainTechnicianServiceRequestsComponent),
      },
      {
        path: 'main-technician-service-request-details/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-service-request-details/main-technician-service-request-details.component').then(m => m.MainTechnicianServiceRequestDetailsComponent),
      },
      {
        path: 'main-technician-service-history/:source/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-service-history/main-technician-service-history.component').then(m => m.MainTechnicianServiceHistoryComponent),
      },
      {
        path: 'main-technician-service-history/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-service-history/main-technician-service-history.component').then(m => m.MainTechnicianServiceHistoryComponent),
      },
      {
        path: 'main-technician-team-management',
        loadComponent: () => import('./features/technician/pages/main-technician-team-management/main-technician-team-management.component').then(m => m.MainTechnicianTeamManagementComponent),
      },
      {
        path: 'main-technician-maintenance',
        loadComponent: () => import('./features/technician/pages/main-technician-maintenance/main-technician-maintenance.component').then(m => m.MainTechnicianMaintenanceComponent),
      },
      {
        path: 'main-technician-maintenance-details/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-maintenance-details/main-technician-maintenance-details.component').then(m => m.MainTechnicianMaintenanceDetailsComponent),
      },
      {
        path: 'main-technician-maintenance-scheduling',
        loadComponent: () => import('./features/technician/pages/main-technician-maintenance-scheduling/main-technician-maintenance-scheduling.component').then(m => m.MainTechnicianMaintenanceSchedulingComponent),
      },
      {
        path: 'main-technician-materials',
        loadComponent: () => import('./features/technician/pages/main-technician-materials/main-technician-materials.component').then(m => m.MainTechnicianMaterialsComponent),
      },
      {
        path: 'main-technician-service-reports',
        loadComponent: () => import('./features/technician/pages/main-technician-service-report/main-technician-service-report.component').then(m => m.MainTechnicianServiceReportsComponent),
      },
      {
        path: 'main-technician-service-report-review/:id',
        loadComponent: () => import('./features/technician/pages/main-technician-service-report-review/main-technician-service-report-review.component').then(m => m.MainTechnicianServiceReportReviewComponent),
      },
    ]
  },

  // ── Service Team A portal
  {
    path: 'service-team-a',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['SERVICE_TEAM', 'SUPER_ADMIN'], team: 'A' },
    component: ServiceTeamLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ServiceTeamDashboardComponent },
      { path: 'assigned-jobs', component: ServiceTeamAssignedJobsComponent },
      { path: 'team-details', component: ServiceTeamTeamDetailsComponent },
      { path: 'service-details/:id', component: ServiceTeamServiceDetailsComponent },
      { path: 'service-history/:id', component: ServiceTeamServiceHistoryComponent }
    ]
  },

  // ── Service Team portal (Generic/Fallback)
  {
    path: 'service-team',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['SERVICE_TEAM', 'SUPER_ADMIN'] },
    component: ServiceTeamLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ServiceTeamDashboardComponent },
      { path: 'assigned-jobs', component: ServiceTeamAssignedJobsComponent },
      { path: 'team-details', component: ServiceTeamTeamDetailsComponent },
      { path: 'service-details/:id', component: ServiceTeamServiceDetailsComponent },
      { path: 'service-history/:id', component: ServiceTeamServiceHistoryComponent }
    ]
  },

  // ── Service Team B portal
  {
    path: 'service-team-b',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['SERVICE_TEAM', 'SUPER_ADMIN'], team: 'B' },
    component: ServiceTeamLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ServiceTeamDashboardComponent },
      { path: 'assigned-jobs', component: ServiceTeamAssignedJobsComponent },
      { path: 'team-details', component: ServiceTeamTeamDetailsComponent },
      { path: 'service-details/:id', component: ServiceTeamServiceDetailsComponent },
      { path: 'service-history/:id', component: ServiceTeamServiceHistoryComponent }
    ]
  },

  // ── Backward compatibility redirects
  { path: 'service-dashboard', redirectTo: 'service-team/dashboard', pathMatch: 'full' },
  { path: 'service-team-dashboard', redirectTo: 'service-team/dashboard', pathMatch: 'full' },
  { path: 'service-team-assigned-jobs', redirectTo: 'service-team/assigned-jobs', pathMatch: 'full' },
  { path: 'service-team-team-details', redirectTo: 'service-team/team-details', pathMatch: 'full' },

  // =========================================================
  // PUBLIC PAGES
  // =========================================================



  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then(
        (m) => m.SignupComponent
      ),
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
    path: 'reactivation-request',
    loadComponent: () =>
      import(
        './pages/reactivation-request/reactivation-request.component'
      ).then((m) => m.ReactivationRequestComponent),
  },

  {
    path: 'maintenance',
    loadComponent: () =>
      import('./pages/maintenance/maintenance.component').then(
        (m) => m.MaintenanceComponent
      ),
  },

  // =========================================================
  // CUSTOMER DASHBOARD
  // =========================================================

  {
    path: 'dashboard',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['CUSTOMER', 'SUPER_ADMIN'] },
    loadComponent: () =>
      import(
        './features/customer/components/layout/customer-layout/customer-layout.component'
      ).then((m) => m.CustomerLayoutComponent),

    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/customer/pages/dashboard/customer-dashboard-home.component'
          ).then((m) => m.CustomerDashboardHomeComponent),
      },

      {
        path: 'orders',
        loadComponent: () =>
          import(
            './features/customer/pages/orders/customer-orders.component'
          ).then((m) => m.CustomerOrdersComponent),
      },

      {
        path: 'settings',
        loadComponent: () =>
          import(
            './features/customer/pages/settings/notification-settings.component'
          ).then((m) => m.NotificationSettingsComponent),
      },

      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/customer/pages/notifications/notifications.component'
          ).then((m) => m.NotificationsPageComponent),
      },

      {
        path: 'profile',
        loadComponent: () =>
          import(
            './features/customer/pages/profile/customer-profile.component'
          ).then((m) => m.CustomerProfileComponent),
      },
    ],
  },

  // =========================================================
  // SUPER ADMIN
  // =========================================================

  {
    path: 'super-admin',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: {
      roles: ['SUPER_ADMIN'],
    },

    loadComponent: () =>
      import(
        './features/super-admin/components/layout/super-admin-layout/super-admin-layout.component'
      ).then((m) => m.SuperAdminLayoutComponent),

    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/super-admin/pages/dashboard/super-admin-dashboard.component'
          ).then((m) => m.SuperAdminDashboardComponent),
      },

      {
        path: 'users',
        loadComponent: () =>
          import(
            './features/super-admin/pages/users/users.component'
          ).then((m) => m.UsersComponent),
      },

      {
        path: 'core-operations',
        loadComponent: () =>
          import(
            './features/super-admin/pages/core-operations/core-operations.component'
          ).then((m) => m.CoreOperationsComponent),
      },

      {
        path: 'requests',
        redirectTo: 'core-operations',
        pathMatch: 'full'
      },

      {
        path: 'global-notifications',
        loadComponent: () =>
          import(
            './features/super-admin/pages/global-notifications/global-notifications.component'
          ).then((m) => m.GlobalNotificationsComponent),
      },

      {
        path: 'system-config',
        loadComponent: () =>
          import(
            './features/super-admin/pages/system-config/system-config.component'
          ).then((m) => m.SystemConfigComponent),
      },

      {
        path: 'system-logs',
        loadComponent: () =>
          import(
            './features/super-admin/pages/system-logs-monitoring/system-logs-monitoring.component'
          ).then((m) => m.SystemLogsMonitoringComponent),
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

  // =========================================================
  // PRODUCT / SHOP
  // =========================================================

  {
    path: 'catalog',
    component: Catalog,
  },

  {
    path: 'product-detail',
    component: ProductDetail,
  },

  {
    path: 'buy-install',
    component: BuyInstall,
  },

  {
    path: 'consultation-bridge',
    component: ConsultationBridge,
  },

  {
    path: 'cart',
    component: Cart,
  },

  {
    path: 'checkout',
    component: Checkout,
  },

  {
    path: 'order-success',
    component: OrderSuccess,
  },

  {
    path: 'admin/bank-settings',
    component: BankSettings,
  },

  // =========================================================
  // FINANCE
  // =========================================================
  // IMPORTANT:
  // Finance is under /finance because /dashboard already belongs
  // to the customer dashboard.

  {
    path: 'finance',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['FINANCE', 'SUPER_ADMIN'] },
    component: FinanceLayoutComponent,

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        component: DashboardComponent,
      },

      {
        path: 'payment-verification',
        component: PaymentVerificationComponent,
      },

      {
        path: 'verified-payments',
        component: VerifiedPaymentsComponent,
      },

      {
        path: 'rejected-payments',
        component: RejectedPaymentsComponent,
      },

      {
        path: 'inspection-payment-verification',
        component: InspectionPaymentVerificationComponent,
      },

      {
        path: 'inspection-verified-payments',
        component: InspectionVerifiedPaymentsComponent,
      },

      {
        path: 'inspection-rejected-payments',
        component: InspectionRejectedPaymentsComponent,
      },

      // Invoice
      {
        path: 'invoice/generate',
        component: InvoiceGenerateComponent,
      },

      {
        path: 'invoice/pending',
        component: InvoicePendingComponent,
      },

      {
        path: 'invoice/accepted',
        component: InvoiceAcceptedComponent,
      },

      {
        path: 'invoice/rejected',
        component: InvoiceRejectedComponent,
      },

      {
        path: 'invoice/paid',
        component: InvoicePaidComponent,
      },

      {
        path: 'invoice/auto-cancelled',
        component: InvoiceAutoCancelledComponent,
      },

      {
        path: 'invoice/dashboard',
        component: InvoiceDashboardComponent,
      },

      {
        path: 'invoice/create',
        component: InvoiceCreatorComponent,
      },

      {
        path: 'invoice/payment-verification',
        component: InvoicePaymentVerificationComponent,
      },

      {
        path: 'invoice/verified-payments',
        component: InvoiceVerifiedPaymentsComponent,
      },

      {
        path: 'invoice/rejected-payments',
        component: InvoiceRejectedPaymentsComponent,
      },

      // Services
      {
        path: 'services/repair-verification',
        component: ServicePaymentVerificationComponent,
      },

      {
        path: 'services/repair-verified',
        component: ServiceVerifiedPaymentsComponent,
      },

      {
        path: 'services/repair-rejected',
        component: ServiceRejectedPaymentsComponent,
      },

      {
        path: 'services/maintenance-verification',
        component: ServicePaymentVerificationComponent,
      },

      {
        path: 'services/maintenance-verified',
        component: ServiceVerifiedPaymentsComponent,
      },

      {
        path: 'services/maintenance-rejected',
        component: ServiceRejectedPaymentsComponent,
      },

      {
        path: 'payment-audit-log',
        component: PaymentAuditLogComponent,
      },

      {
        path: 'financial-report',
        component: FinancialReportComponent,
      },

      // Purchase Requests
      {
        path: 'purchase-requests/pending',
        component: PurchaseRequestVerificationComponent,
      },

      {
        path: 'purchase-requests/approved',
        component: PurchaseRequestApprovedComponent,
      },

      {
        path: 'purchase-requests/rejected',
        component: PurchaseRequestRejectedComponent,
      },
    ],
  },

  // =========================================================
  // INSPECTION TEAM
  // =========================================================

  {
    path: 'inspection-officer',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['INSPECTION', 'SUPER_ADMIN'] },
    component: InspectionLayoutComponent,

    children: [
      {
        path: 'scheduled-inspections',
        component: ScheduledInspectionsComponent,
      },

      {
        path: 'ongoing-inspections',
        component: OngoingInspectionsComponent,
      },

      {
        path: 'completed-inspections',
        component: CompletedInspectionsComponent,
      },

      {
        path: 'dashboard',
        component: InspectionDashboardComponent,
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // =========================================================
  // CUSTOMER INSPECTION PAGES
  // =========================================================

  {
    path: 'inspection-report',
    component: InspectionReportComponent,
  },

  {
    path: 'inspection-payment',
    component: InspectionPaymentComponent,
  },

  {
    path: 'inspection-scheduling',
    component: InspectionSchedulingComponent,
  },

  {
    path: 'customer/invoice',
    component: CustomerInvoiceComponent,
  },
  { path: 'invoice/upload-payment',
    component: InvoicePaymentUploadComponent },

  // =========================================================
  // CSA (CUSTOMER SUPPORT AGENT)
  // =========================================================
  {
    path: 'csa',
    canActivate: [authGuard, maintenanceGuard, roleGuard],
    data: { roles: ['CSA', 'SUPER_ADMIN'] },
    component: CsaLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CsaDashboardComponent },
      { path: 'customers', component: CsaCustomersComponent },
      { path: 'service-tickets', component: CsaServiceTicketsComponent },
      { path: 'inquiries', component: CsaInquiriesComponent },
      { path: 'maintenance-schedules', component: CsaMaintenanceSchedulesComponent },
      {
        path: 'profile',
        loadComponent: () =>
          import(
            './features/customer/pages/profile/customer-profile.component'
          ).then((m) => m.CustomerProfileComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import(
            './features/csa/pages/csa-settings/csa-settings.component'
          ).then((m) => m.CsaSettingsComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import(
            './features/customer/pages/notifications/notifications.component'
          ).then((m) => m.NotificationsPageComponent),
      },
    ]
  },

  // =========================================================
  // FALLBACK
  // =========================================================

  {
    path: '**',
    redirectTo: '',
  },
];
