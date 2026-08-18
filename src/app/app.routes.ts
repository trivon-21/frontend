import { Routes } from '@angular/router';

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

export const routes: Routes = [
  // =========================================================
  // PUBLIC PAGES
  // =========================================================

  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },

  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.component').then(
        (m) => m.SignupComponent
      ),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(
        (m) => m.LoginComponent
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
    canActivate: [authGuard, maintenanceGuard],
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

  // =========================================================
  // FALLBACK
  // =========================================================

  {
    path: '**',
    redirectTo: '',
  },
];