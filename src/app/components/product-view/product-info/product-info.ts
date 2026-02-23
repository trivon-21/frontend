/**
 * product-info.ts
 * Displays the product title, price, capacity selector, features,
 * quantity stepper, and action buttons (Add to Cart / View Warranty).
 *
 * Receives the full Product via input() from ProductViewComponent.
 * All reactive UI state (quantity, selected capacity, checkbox) is
 * managed internally using Angular signals.
 */

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
  /** The full Product object passed down from ProductViewComponent. */
  readonly product = input.required<Product>();

  /** Signal for the currently selected capacity option. */
  readonly selectedCapacity = signal<CapacityOption | null>(null);

  /** Signal for the quantity stepper value. Minimum value is 1. */
  readonly quantity = signal(1);

  /** Signal tracking whether the user has acknowledged the product specifications. */
  readonly hasAcknowledged = signal(false);

  /** Formatted price for the currently selected capacity (falls back to base price). */
  readonly displayPrice = computed(() => this.selectedCapacity()?.price ?? this.product().price);

  constructor() {
    // Initialize selected capacity when product input changes
    effect(() => {
      const p = this.product();
      if (p.capacityOptions.length > 0) {
        this.selectedCapacity.set(p.capacityOptions[0]);
      }
    });
  }

  /** Updates the selected capacity when the dropdown changes. */
  onCapacityChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const match = this.product().capacityOptions.find((opt) => opt.label === target.value);
    if (match) {
      this.selectedCapacity.set(match);
    }
  }

  /** Increments the quantity by 1. */
  increment(): void {
    this.quantity.update((q) => q + 1);
  }

  /** Decrements the quantity by 1. Will not go below 1. */
  decrement(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  /** Toggles the acknowledgment checkbox state. */
  toggleAcknowledged(): void {
    this.hasAcknowledged.update((v) => !v);
  }
}
