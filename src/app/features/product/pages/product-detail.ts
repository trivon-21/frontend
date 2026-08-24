import { CartService } from '../../cart/pages/cart.service';
import { inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../directives/click-outside.directive';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClickOutsideDirective],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  username: string = 'Customer';
  currentUser: AuthUser | null = null;
  showDropdown = false;
  activeTab: 'description' | 'spec' | 'warranty' | 'reviews' = 'description';
  private cartService = inject(CartService);
  public router = inject(Router);
  private authService = inject(AuthService);

  // Purchase flow options
  purchaseOption: 'buy-only' | 'buy-install' | null = null;
  awarenessOption: 'know' | 'unsure' | null = null;

  selectAwareness(option: 'know' | 'unsure') {
    this.awarenessOption = option;
    this.purchaseOption = null; // always reset purchase choice on awareness change
  }

  // Success toast
  cartSuccess = false;
  private successTimer: any = null;

  // Already-in-cart toast
  alreadyInCart = false;
  alreadyInCartToast = false;
  private alreadyInCartTimer: any = null;

  // Login required modal
  showLoginPromptModal = false;
  loginModalMessage = 'You need to be logged into your account before adding items to your cart.';
  modalReturnUrl = '';

  onCartNavClick(event?: Event) {
    if (event) event.preventDefault();
    if (!this.authService.isLoggedIn()) {
      this.loginModalMessage = 'You need to be logged into your account to view your shopping cart.';
      this.modalReturnUrl = '/cart';
      this.showLoginPromptModal = true;
    } else {
      this.router.navigate(['/cart']);
    }
  }

  closeLoginPromptModal() {
    this.showLoginPromptModal = false;
  }

  goToLoginFromModal() {
    this.showLoginPromptModal = false;
    const returnUrl = this.modalReturnUrl || this.router.url;
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  /**
 * Adds the current product and selected quantity to the user's cart via the backend API.
 * Requires the user to be logged in before adding to cart.
 */
  addToCart() {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.loginModalMessage = 'You need to be logged into your account before adding items to your cart.';
      this.modalReturnUrl = this.router.url;
      this.showLoginPromptModal = true;
      return;
    }

    // Determine purchase type from the selected option
    const purchaseType: 'buy_only' | 'buy_and_install' =
      this.purchaseOption === 'buy-install' ? 'buy_and_install' : 'buy_only';

    // If product is already in cart, show the warning toast instead
    if (this.alreadyInCart) {
      this.showAlreadyInCartToast();
      return;
    }

    const user = this.authService.getCurrentUser();
    const userId = user ? (user.id || (user as any)._id) : 'demo-user';
    const productId = this.product._id;
    const quantity = this.quantity;
    this.cartService.addOrUpdateItem(userId, productId, quantity, purchaseType).subscribe({
      next: () => {
        this.alreadyInCart = true;
        this.showSuccessToast();
      },
      error: () => {
        alert('Failed to add to cart. Please try again.');
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

  showAlreadyInCartToast() {
    this.alreadyInCartToast = true;
    if (this.alreadyInCartTimer) clearTimeout(this.alreadyInCartTimer);
    this.alreadyInCartTimer = setTimeout(() => { this.alreadyInCartToast = false; }, 3000);
  }

  closeAlreadyInCartToast() {
    this.alreadyInCartToast = false;
    if (this.alreadyInCartTimer) clearTimeout(this.alreadyInCartTimer);
  }

  // API state
  product: any = null;
  loading: boolean = true;
  error: string = '';

  // Image gallery
  selectedImageIdx = 0;

  // Quantity
  quantity = 1;

  // Reviews
  newReview = {
    userName: '',
    rating: 5,
    comment: ''
  };
  submittingReview = false;

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  // Capacity dropdown
  selectedVariant: any = null;
  capacityDropdownOpen = false;

  private readonly API_BASE = `${environment.apiUrl}/products`;

  constructor() {
    const user = this.authService.getCurrentUser();
    this.currentUser = user;
    this.username = user ? user.fullName.split(' ')[0] : 'Customer';
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.username = user ? user.fullName.split(' ')[0] : 'Customer';
    });

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

  getInitials(name: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.showDropdown = false;
    this.router.navigate(['/']);
  }

  getDashboardUrl(): string {
    if (this.currentUser?.role === 'SUPER_ADMIN') {
      return '/super-admin';
    }
    return '/dashboard';
  }

  fetchProduct(id: string) {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${this.API_BASE}/${id}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.product = res.data;
          if (this.product.variants && this.product.variants.length > 0) {
            const match = this.product.variants.find((v: any) => v.capacity === this.product.capacity);
            this.selectedVariant = match || this.product.variants[0];
          } else {
            this.selectedVariant = {
              capacity: this.product.capacity,
              price: this.product.price,
              label: `${this.product.capacity} BTU`
            };
          }
          // Check if already in cart
          this.checkIfInCart(this.product._id);
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

  checkIfInCart(productId: string) {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.alreadyInCart = false;
      return;
    }
    const userId = user.id || (user as any)._id || 'demo-user';
    this.cartService.getCart(userId).subscribe({
      next: (res) => {
        const items = res?.cart?.items ?? [];
        this.alreadyInCart = items.some((item: any) => {
          const id = item.product?._id ?? item.product;
          return id === productId;
        });
      },
      error: () => { /* silently ignore — cart may not exist yet */ }
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
        label: `${this.product.capacity} BTU`
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
    return `${variant.capacity} BTU – LKR ${variant.price.toLocaleString()}`;
  }

  // --- Quantity ---
  changeQty(delta: number) {
    const newQty = this.quantity + delta;
    this.quantity = newQty < 1 ? 1 : newQty;
  }

  // --- Tabs ---
  switchTab(tab: 'description' | 'spec' | 'warranty' | 'reviews') {
    this.activeTab = tab;
  }

  // --- Rating ---
  getStars(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  onGetExpertAdvice() {
    if (!this.authService.isLoggedIn()) {
      this.showLoginPromptModal = true;
      return;
    }

    this.router.navigate(['/consultation-bridge'], {
      state: { 
        productId: this.product._id,
        productName: this.product.name
      }
    });
  }
}
