import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { HeroSectionComponent } from '../../shared/hero-section/hero-section';
import { FooterComponent } from '../../shared/footer/footer';
import { ProductGalleryComponent } from './product-gallery/product-gallery';
import { ProductInfoComponent } from './product-info/product-info';
import { ProductTabsComponent } from './product-tabs/product-tabs';

@Component({
  selector: 'app-product-view',
  imports: [
    NavbarComponent,
    HeroSectionComponent,
    FooterComponent,
    ProductGalleryComponent,
    ProductInfoComponent,
    ProductTabsComponent,
  ],
  templateUrl: './product-view.html',
  styleUrl: './product-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductViewComponent {
  private readonly productService = inject(ProductService);
  readonly product = this.productService.product;
  readonly loading = this.productService.loading;
  readonly error = this.productService.error;
}
