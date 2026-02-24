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
  readonly product = input.required<Product>();
  readonly activeImageIndex = signal(0);
  readonly activeImage = computed(() => this.product().images[this.activeImageIndex()]);
  readonly thumbnails = computed(() => this.product().images.slice(1));

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }
}
