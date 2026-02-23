import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PaymentVerificationComponent } from './pages/payment-verification/payment-verification.component';
import { VerifiedPaymentsComponent } from './pages/verified-payments/verified-payments.component';
import { RejectedPaymentsComponent } from './pages/rejected-payments/rejected-payments.component';

export const routes: Routes = [


  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  { path: 'dashboard', component: DashboardComponent },

  { path: 'payment-verification', component: PaymentVerificationComponent },
  { path: 'verified-payments', component: VerifiedPaymentsComponent },
  { path: 'rejected-payments', component: RejectedPaymentsComponent },

  { path: '**', redirectTo: '/dashboard' }

];