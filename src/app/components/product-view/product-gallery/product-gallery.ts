/**
 * product-gallery.ts
 * Displays the main product image and a row of clickable thumbnails below it.
 *
 * Receives the full product via input() from the parent ProductViewComponent.
 * Uses an internal Angular signal to track which thumbnail is currently selected.
 */

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-gallery',
  imports: [],
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGalleryComponent {
  /** The full Product object passed down from ProductViewComponent. */
  readonly product = input.required<Product>();

  /** Signal tracking the index of the currently displayed main image. */
  readonly activeImageIndex = signal(0);

  /** URL of the currently selected main image. */
  readonly activeImage = computed(() => this.product().images[this.activeImageIndex()]);

  /** Thumbnail images (all images except the first / main image). */
  readonly thumbnails = computed(() => this.product().images.slice(1));

  /** Sets the active image index when a thumbnail is clicked. */
  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }
}
