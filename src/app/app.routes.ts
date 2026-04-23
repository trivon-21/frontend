import { Routes } from '@angular/router';
import { FinanceLayoutComponent } from './features/finance/layout/finance-layout/finance-layout.component';
import { DashboardComponent } from './features/finance/pages/dashboard/dashboard.component';
import { PaymentVerificationComponent } from './features/finance/pages/payment-verification/payment-verification.component';
import { VerifiedPaymentsComponent } from './features/finance/pages/verified-payments/verified-payments.component';
import { RejectedPaymentsComponent } from './features/finance/pages/rejected-payments/rejected-payments.component';
import { InspectionPaymentComponent } from './features/customer/pages/inspection-payment/inspection-payment.component';
import { InspectionPaymentVerificationComponent } from './features/finance/pages/inspection-payment-verification/inspection-payment-verification.component';
import { InspectionVerifiedPaymentsComponent } from './features/finance/pages/inspection-verified-payments/inspection-verified-payments.component';
import { InspectionRejectedPaymentsComponent } from './features/finance/pages/inspection-rejected-payments/inspection-rejected-payments.component';
import { InspectionSchedulingComponent } from './features/customer/pages/inspection-scheduling/inspection-scheduling.component';
import { InspectionLayoutComponent } from './features/inspection-team/layout/inspection-layout/inspection-layout.component';
import { ScheduledInspectionsComponent } from './features/inspection-team/pages/scheduled-inspections/scheduled-inspections.component';
import { OngoingInspectionsComponent } from './features/inspection-team/pages/ongoing-inspections/ongoing-inspections.component';
import { CompletedInspectionsComponent } from './features/inspection-team/pages/completed-inspections/completed-inspections.component';
import { InspectionDashboardComponent } from './features/inspection-team/pages/inspection-dashboard/inspection-dashboard.component';
import { InspectionReportComponent } from './features/customer/pages/inspection-report/inspection-report.component';
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
import { CustomerInvoiceComponent } from './features/customer/pages/customer-invoice/customer-invoice.component';
import { ServicePaymentVerificationComponent } from './features/finance/pages/service-payment-verification/service-payment-verification.component';
import { ServiceVerifiedPaymentsComponent }    from './features/finance/pages/service-verified-payments/service-verified-payments.component';
import { ServiceRejectedPaymentsComponent }    from './features/finance/pages/service-rejected-payments/service-rejected-payments.component';
export const routes: Routes = [
  {
    path: '',
    component: FinanceLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'payment-verification', component: PaymentVerificationComponent },
      { path: 'verified-payments', component: VerifiedPaymentsComponent },
      { path: 'rejected-payments', component: RejectedPaymentsComponent },
      { path: 'inspection-payment-verification', component: InspectionPaymentVerificationComponent },
      { path: 'inspection-verified-payments', component: InspectionVerifiedPaymentsComponent },
      { path: 'inspection-rejected-payments', component: InspectionRejectedPaymentsComponent },
      { path: 'invoice/generate', component: InvoiceGenerateComponent },
      { path: 'invoice/pending', component: InvoicePendingComponent },
      { path: 'invoice/accepted', component: InvoiceAcceptedComponent },
      { path: 'invoice/rejected', component: InvoiceRejectedComponent },
      { path: 'invoice/paid', component: InvoicePaidComponent },
      { path: 'invoice/auto-cancelled', component: InvoiceAutoCancelledComponent },
      { path: 'invoice/dashboard', component: InvoiceDashboardComponent },
      { path: 'invoice/create', component: InvoiceCreatorComponent },
      { path: 'invoice/payment-verification', component: InvoicePaymentVerificationComponent },
      { path: 'invoice/verified-payments', component: InvoiceVerifiedPaymentsComponent },
      { path: 'invoice/rejected-payments', component: InvoiceRejectedPaymentsComponent },
      { path: 'services/repair-verification',        component: ServicePaymentVerificationComponent },
{ path: 'services/repair-verified',            component: ServiceVerifiedPaymentsComponent    },
{ path: 'services/repair-rejected',            component: ServiceRejectedPaymentsComponent    },
{ path: 'services/maintenance-verification',   component: ServicePaymentVerificationComponent },
{ path: 'services/maintenance-verified',       component: ServiceVerifiedPaymentsComponent    },
{ path: 'services/maintenance-rejected',       component: ServiceRejectedPaymentsComponent    },

    ]
  },
      { path: 'inspection-report', component: InspectionReportComponent },
  {
  path: 'inspection-officer',
  component: InspectionLayoutComponent,
  children: [
    { path: 'scheduled-inspections', component: ScheduledInspectionsComponent },
    { path: 'ongoing-inspections', component: OngoingInspectionsComponent },
    { path: 'completed-inspections', component: CompletedInspectionsComponent },
    { path: 'dashboard', component: InspectionDashboardComponent },
    { path: '**', redirectTo: '/dashboard' }//check this
    // future pages go here
  ]
},
  // Customer pages - no sidebar/header
  { path: 'inspection-payment', component: InspectionPaymentComponent },
  { path: 'inspection-scheduling', component: InspectionSchedulingComponent },
  { path: 'customer/invoice', component: CustomerInvoiceComponent },
  { path: '**', redirectTo: '/dashboard' }
];
