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
  readonly product = input.required<Product>();
  readonly activeTab = signal<ActiveTab>('specifications');

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }
}
