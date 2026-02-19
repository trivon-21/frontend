import { Routes } from '@angular/router';
import { Catalog } from './pages/catalog/catalog';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';

export const routes: Routes = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'catalog', component: Catalog },
  { path: 'product-detail', component: ProductDetail },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: Checkout }
];