/**
 * app.routes.ts
 * Application route definitions — direct imports, no lazy loading.
 *
 * Route convention:
 *   ''         → LandingComponent    (home / welcome page)
 *   'products' → ProductViewComponent (product detail page)
 *
 * Add new page routes here as the system grows.
 */

import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing';
import { ProductViewComponent } from './components/product-view/product-view';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent, // Default route → home page
  },
  {
    path: 'products',
    component: ProductViewComponent, // Product view page
  },
  {
    path: '**',
    redirectTo: '', // Unknown routes → home
  },
];
