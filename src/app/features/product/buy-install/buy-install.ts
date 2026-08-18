import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../cart/pages/cart.service';
import { inject } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-buy-install',
  imports: [CommonModule],
  templateUrl: './buy-install.html',
  styleUrl: './buy-install.css',
})
export class BuyInstall implements OnInit {

  // API state
  product: any = null;
  loading: boolean = true;
  error: string = '';

  // Image gallery
  selectedImageIdx = 0;

  // Quantity
  quantity = 1;

  // Awareness & purchase options
  awarenessOption: 'know' | 'unsure' = 'know';
  purchaseOption: 'buy' | 'install' = 'buy';

  // Tabs: description | spec | warranty | reviews
  activeTab: 'description' | 'spec' | 'warranty' | 'reviews' = 'description';

  // Variant / capacity
  selectedVariant: any = null;

  private readonly API_BASE = `${environment.apiUrl}/products`;
  private cartService = inject(CartService);
  private router = inject(Router);

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

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

    // Check for auto-select state from Consultation Bridge
    const state = history.state;
    if (state && state.autoKnow) {
      this.awarenessOption = 'know';
    }
  }

  fetchProduct(id: string) {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${this.API_BASE}/${id}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.product = res.data;
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

  // --- Pricing ---
  get selectedPrice(): number {
    return this.selectedVariant?.price ?? this.product?.price ?? 0;
  }

  // --- Quantity ---
  changeQty(delta: number) {
    const newQty = this.quantity + delta;
    this.quantity = newQty < 1 ? 1 : newQty;
  }

  // --- Options ---
  setAwareness(option: 'know' | 'unsure') {
    this.awarenessOption = option;
  }

  setPurchase(option: 'buy' | 'install') {
    this.purchaseOption = option;
  }

  // --- Tabs ---
  switchTab(tab: 'description' | 'spec' | 'warranty' | 'reviews') {
    this.activeTab = tab;
  }

  // --- Star rating helper ---
  getStars(rating: number): boolean[] {
    const fullStars = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => i < fullStars);
  }

  // --- Add to Cart ---
  addToCart() {
    const userId = localStorage.getItem('userId') || 'demo-user';
    const productId = this.product._id;
    const quantity = this.quantity;
    this.cartService.addOrUpdateItem(userId, productId, quantity).subscribe({
      next: () => alert('Added to cart!'),
      error: () => alert('Failed to add to cart.')
    });
  }

  onGetExpertAdvice() {
    this.router.navigate(['/consultation-bridge'], {
      state: { 
        productId: this.product._id,
        productName: this.product.name
      }
    });
  }
}
