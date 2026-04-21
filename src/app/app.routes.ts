import { Routes } from '@angular/router';
import { FinanceLayoutComponent } from './layout/finance-layout/finance-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PaymentVerificationComponent } from './pages/payment-verification/payment-verification.component';
import { VerifiedPaymentsComponent } from './pages/verified-payments/verified-payments.component';
import { RejectedPaymentsComponent } from './pages/rejected-payments/rejected-payments.component';
import { InspectionPaymentComponent } from './pages/inspection-payment/inspection-payment.component';
import { InspectionPaymentVerificationComponent } from './pages/inspection-payment-verification/inspection-payment-verification.component';
import { InspectionVerifiedPaymentsComponent } from './pages/inspection-verified-payments/inspection-verified-payments.component';
import { InspectionRejectedPaymentsComponent } from './pages/inspection-rejected-payments/inspection-rejected-payments.component';
import { InspectionSchedulingComponent } from './pages/inspection-scheduling/inspection-scheduling.component';
import { InspectionLayoutComponent } from './layout/inspection-layout/inspection-layout.component';
import { ScheduledInspectionsComponent } from './pages/scheduled-inspections/scheduled-inspections.component';
import { OngoingInspectionsComponent } from './pages/ongoing-inspections/ongoing-inspections.component';
import { CompletedInspectionsComponent } from './pages/completed-inspections/completed-inspections.component';
import { InspectionDashboardComponent } from './pages/inspection-dashboard/inspection-dashboard.component';
import { InspectionReportComponent } from './pages/inspection-report/inspection-report.component';
import { InvoiceGenerateComponent } from './pages/invoice-generate/invoice-generate.component';
import { InvoicePendingComponent } from './pages/invoice-pending/invoice-pending.component';
import { InvoiceAcceptedComponent } from './pages/invoice-accepted/invoice-accepted.component';
import { InvoiceRejectedComponent } from './pages/invoice-rejected/invoice-rejected.component';
import { InvoicePaidComponent } from './pages/invoice-paid/invoice-paid.component';
import { InvoiceAutoCancelledComponent } from './pages/invoice-auto-cancelled/invoice-auto-cancelled.component';
import { InvoiceDashboardComponent } from './pages/invoice-dashboard/invoice-dashboard.component';
import { InvoiceCreatorComponent } from './pages/invoice-creator/invoice-creator.component';
import { InvoicePaymentVerificationComponent } from './pages/invoice-payment-verification/invoice-payment-verification.component';
import { InvoiceVerifiedPaymentsComponent } from './pages/invoice-verified-payments/invoice-verified-payments.component';
import { InvoiceRejectedPaymentsComponent } from './pages/invoice-rejected-payments/invoice-rejected-payments.component';
import { CustomerInvoiceComponent } from './pages/customer-invoice/customer-invoice.component';
import { ServicePaymentVerificationComponent } from './pages/service-payment-verification/service-payment-verification.component';
import { ServiceVerifiedPaymentsComponent }    from './pages/service-verified-payments/service-verified-payments.component';
import { ServiceRejectedPaymentsComponent }    from './pages/service-rejected-payments/service-rejected-payments.component';
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
