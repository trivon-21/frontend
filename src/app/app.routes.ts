import { Routes } from '@angular/router';
import { Catalog } from './features/product/catalog/catalog';
import { ProductDetail } from './features/product/pages/product-detail';
import { Cart } from './features/cart/pages/cart';
import { Checkout } from './features/cart/checkout/checkout';
import { OrderSuccess } from './features/cart/order-success/order-success';
import { BuyInstall } from './features/product/buy-install/buy-install';
import { BankSettings } from './features/admin/bank-settings/bank-settings';
import { ConsultationBridge } from './features/consultation-bridge/consultation-bridge';


export const routes: Routes = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'catalog', component: Catalog },
  { path: 'product-detail', component: ProductDetail },
  { path: 'buy-install', component: BuyInstall },
  { path: 'consultation-bridge', component: ConsultationBridge },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: Checkout },
  { path: 'order-success', component: OrderSuccess },
  { path: 'admin/bank-settings', component: BankSettings }
];