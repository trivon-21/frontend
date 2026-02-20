import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// ✅ Import the standalone component
import { PaymentVerificationComponent } from './pages/payment-verification/payment-verification.component';

const routes: Routes = [
  { path: '', redirectTo: '/payment-verification', pathMatch: 'full' },
  { 
    path: 'payment-verification', 
    component: PaymentVerificationComponent // ✅ Works with standalone
  },
  { path: '**', redirectTo: '/payment-verification' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }