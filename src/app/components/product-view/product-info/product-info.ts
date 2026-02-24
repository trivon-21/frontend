import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CapacityOption, Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-info',
  imports: [DecimalPipe],
  templateUrl: './product-info.html',
  styleUrl: './product-info.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInfoComponent {
  readonly product = input.required<Product>();
  readonly selectedCapacity = signal<CapacityOption | null>(null);
  readonly quantity = signal(1);
  readonly hasAcknowledged = signal(false);

  /** Price of the selected capacity; falls back to base product price. */
  readonly displayPrice = computed(() => this.selectedCapacity()?.price ?? this.product().price);

  constructor() {
    effect(() => {
      const p = this.product();
      if (p.capacityOptions.length > 0) {
        this.selectedCapacity.set(p.capacityOptions[0]);
      }
    });
  }

  onCapacityChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const match = this.product().capacityOptions.find((opt) => opt.label === target.value);
    if (match) {
      this.selectedCapacity.set(match);
    }
  }

  increment(): void {
    this.quantity.update((q) => q + 1);
  }

  decrement(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  toggleAcknowledged(): void {
    this.hasAcknowledged.update((v) => !v);
  }
}
