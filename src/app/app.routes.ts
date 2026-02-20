import { Routes } from '@angular/router';
import { PaymentVerificationComponent } from './pages/payment-verification/payment-verification.component';

export const routes: Routes = [
  { path: '', redirectTo: '/payment-verification', pathMatch: 'full' },
  { path: 'payment-verification', component: PaymentVerificationComponent },
  { path: '**', redirectTo: '/payment-verification' }
];
/*import { Routes } from '@angular/router';
import { PaymentVerificationComponent } from './pages/payment-verification/payment-verification.component';

export const routes: Routes = [
  { path: '', component: PaymentVerificationComponent },
  { path: 'payment-verification', component: PaymentVerificationComponent },
  // Add a redirect for the dashboard until you build that page
  { path: 'dashboard', redirectTo: '' }, 
  { path: 'verified-payments', redirectTo: '' },
  { path: 'rejected-payments', redirectTo: '' }
];
*/