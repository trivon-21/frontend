/**
 * product-tabs.ts
 * Displays the tabbed section below the product card.
 * Two tabs: "Specifications" and "Warranty".
 *
 * Receives the full Product via input() from ProductViewComponent.
 * Uses a signal to track which tab is currently active.
 */

import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Product } from '../../../models/product.model';

/** Valid tab identifiers */
type ActiveTab = 'specifications' | 'warranty';

@Component({
  selector: 'app-product-tabs',
  imports: [],
  templateUrl: './product-tabs.html',
  styleUrl: './product-tabs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabsComponent {
  /**
   * The full Product object passed down from ProductViewComponent.
   * Specifications and warranty data come from here — no hardcoding.
   */
  readonly product = input.required<Product>();

  /**
   * Signal tracking the currently visible tab.
   * Defaults to 'specifications' on load.
   */
  readonly activeTab = signal<ActiveTab>('specifications');

  /**
   * Switches the active tab.
   * @param tab - The tab to show: 'specifications' or 'warranty'
   */
  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }
}
