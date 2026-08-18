import { CartService } from '../../features/cart/pages/cart.service';
import { inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  username: string;
  activeTab: 'spec' | 'warranty' = 'spec';
  private cartService = inject(CartService);

  // Specs acknowledgment
  specsAcknowledged = false;
  cartError = '';

  // Success toast
  cartSuccess = false;
  private successTimer: any = null;

  /**
   * Adds the current product and selected quantity to the user's cart via the backend API.
   * Shows a success or error alert based on the API response.
   */
  addToCart(purchaseType: 'buy_only' | 'buy_and_install') {
    if (!this.specsAcknowledged) {
      this.cartError = 'Please tick \'I\'m aware of this product specifications\' before adding to cart.';
      return;
    }
    this.cartError = '';
    console.log('Product:', this.product);
    const userId = localStorage.getItem('userId') || 'demo-user';
    const productId = this.product._id;
    const quantity = this.quantity;
    this.cartService.addOrUpdateItem(userId, productId, quantity, purchaseType).subscribe({
      next: () => {
        this.showSuccessToast();
      },
      error: () => {
        this.cartError = 'Failed to add to cart. Please try again.';
      }
    });
  }

  showSuccessToast() {
    this.cartSuccess = true;
    if (this.successTimer) clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => { this.cartSuccess = false; }, 2800);
  }

  closeSuccessToast() {
    this.cartSuccess = false;
    if (this.successTimer) clearTimeout(this.successTimer);
  }

  // API state
  product: any = null;
  loading: boolean = true;
  error: string = '';

  // Image gallery
  selectedImageIdx = 0;

  // Quantity
  quantity = 1;

  // Capacity dropdown
  selectedVariant: any = null;
  capacityDropdownOpen = false;

  private readonly API_BASE = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.username = localStorage.getItem('username') || 'Customer';
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.fetchProduct(id);
      } else {
        this.loading = false;
        this.error = 'No product selected. Please go back to the catalog and choose a product.';
      }
    });
  }

  fetchProduct(id: string) {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${this.API_BASE}/${id}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.product = res.data;
          // Default selected variant to first variant, or build one from the base capacity/price
          if (this.product.variants && this.product.variants.length > 0) {
            this.selectedVariant = this.product.variants[0];
          } else {
            this.selectedVariant = {
              capacity: this.product.capacity,
              price: this.product.price,
              label: `${this.product.capacity} Ton`
            };
          }
        } else {
          this.error = 'Product not found.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch product:', err);
        this.error = 'Could not load the product. Please try again later.';
        this.loading = false;
      }
    });
  }

  // --- Image gallery ---
  get galleryImages(): string[] {
    if (this.product?.images && this.product.images.length > 0) {
      return this.product.images;
    }
    if (this.product?.image) {
      return [this.product.image];
    }
    return ['assets/placeholder.png'];
  }

  getImageUrl(raw: string): string {
    if (!raw) return 'assets/placeholder.png';
    if (raw.startsWith('http')) return raw;
    return '/images/' + raw;
  }

  selectImage(idx: number) {
    this.selectedImageIdx = idx;
  }

  // --- Variants / Capacity dropdown ---
  get variants(): any[] {
    if (this.product?.variants && this.product.variants.length > 0) {
      return this.product.variants;
    }
    if (this.product) {
      return [{
        capacity: this.product.capacity,
        price: this.product.price,
        label: `${this.product.capacity} Ton`
      }];
    }
    return [];
  }

  get selectedPrice(): number {
    return this.selectedVariant?.price ?? this.product?.price ?? 0;
  }

  openCapacityDropdown() { this.capacityDropdownOpen = true; }
  closeCapacityDropdown() { this.capacityDropdownOpen = false; }

  selectVariant(variant: any) {
    this.selectedVariant = variant;
    this.capacityDropdownOpen = false;
  }

  variantLabel(variant: any): string {
    if (variant.label) return `${variant.label} – LKR ${variant.price.toLocaleString()}`;
    return `${variant.capacity} Ton – LKR ${variant.price.toLocaleString()}`;
  }

  // --- Quantity ---
  changeQty(delta: number) {
    const newQty = this.quantity + delta;
    this.quantity = newQty < 1 ? 1 : newQty;
  }

  // --- Tabs ---
  switchTab(tab: 'spec' | 'warranty') {
    this.activeTab = tab;
  }
}