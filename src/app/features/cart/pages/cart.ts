import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, CartResponse, DisplayCartItem } from './cart.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, DecimalPipe, HttpClientModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  username: string = 'Customer';
  cartItems: DisplayCartItem[] = [];
  subtotal: number = 0;
  additionalCharges: number = 0;
  total: number = 0;
  userId: string = '';

  // Out-of-stock auto-removal notice
  removedItems: string[] = [];

  // Remove-item confirmation dialog
  itemToRemoveIdx: number | null = null;
  itemToRemoveName: string = '';

  // Selection state
  selectedIndices: number[] = [];
  activeType: string | null = null;
  validationError: string | null = null;

  private cartService = inject(CartService);
  public router = inject(Router);

  ngOnInit() {
    this.username = localStorage.getItem('username') || 'Customer';
    this.userId = localStorage.getItem('userId') || 'demo-user';
    this.fetchCart();
  }


  fetchCart() {
    this.cartService.getCart(this.userId).subscribe({
      next: (res: CartResponse) => {
        // Map API items → display items, handling populated product objects
        this.cartItems = res.cart.items.map(item => {
          const prod = item.product;
          const isPopulated = prod && typeof prod === 'object';
          return {
            productId: isPopulated ? prod._id.toString() : (prod?.toString() || ''),
            quantity: item.quantity,
            name: isPopulated ? (prod.name || 'Unknown Product') : 'Unknown Product',
            price: isPopulated ? (prod.price ?? 0) : 0,
            image: isPopulated ? this.getImageUrl(prod.image) : '',
            capacity: isPopulated ? (prod.capacity ? `${prod.capacity} BTU` : '') : '',
            purchaseType: (item.purchaseType as 'buy_only' | 'buy_and_install') || 'buy_only',
          };
        });
        this.subtotal = res.subtotal;
        this.additionalCharges = res.additionalCharges;
        this.total = res.total;
        // Capture any items the backend auto-removed due to out-of-stock
        if (res.removedItems && res.removedItems.length > 0) {
          this.removedItems = res.removedItems;
        }
      },
      error: (err) => {
        console.error('Failed to load cart:', err);
      }
    });
  }

  getImageUrl(raw: string): string {
    if (!raw) return '';
    if (raw.startsWith('http')) return raw;
    return '/images/' + raw;
  }

  changeQty(idx: number, delta: number) {
    const item = this.cartItems[idx];
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    this.cartService.addOrUpdateItem(this.userId, item.productId, newQty, item.purchaseType).subscribe({
      next: () => this.fetchCart(),
      error: (err) => console.error('Failed to update quantity:', err)
    });
  }

  // Opens the confirmation dialog for the given cart item
  askRemove(idx: number) {
    this.itemToRemoveIdx = idx;
    this.itemToRemoveName = this.cartItems[idx]?.name || 'this item';
  }

  // User confirmed — call API then refresh
  confirmRemove() {
    if (this.itemToRemoveIdx === null) return;
    const item = this.cartItems[this.itemToRemoveIdx];
    this.cartService.removeItem(this.userId, item.productId).subscribe({
      next: () => {
        this.itemToRemoveIdx = null;
        this.itemToRemoveName = '';
        this.fetchCart();
      },
      error: (err) => console.error('Failed to remove item:', err)
    });
  }

  // User cancelled — close dialog
  cancelRemove() {
    this.itemToRemoveIdx = null;
    this.itemToRemoveName = '';
  }

  // Dismiss the out-of-stock removal notice
  dismissRemovedNotice() {
    this.removedItems = [];
  }

  getItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  /** Returns the human-readable label for a purchase type */
  getPurchaseTypeLabel(purchaseType: string): string {
    return purchaseType === 'buy_and_install' ? 'Buy & Install' : 'Buy Only';
  }

  /** Returns the CSS class for the badge based on purchase type */
  getPurchaseTypeBadgeClass(purchaseType: string): string {
    return purchaseType === 'buy_and_install' ? 'badge-buy-install' : 'badge-buy-only';
  }

  /** Checks if the cart contains a mix of Buy Only and Buy & Install items */
  hasMixedItems(): boolean {
    if (!this.cartItems || this.cartItems.length < 2) return false;
    const hasBuyOnly = this.cartItems.some(item => item.purchaseType === 'buy_only');
    const hasBuyAndInstall = this.cartItems.some(item => item.purchaseType === 'buy_and_install');
    return hasBuyOnly && hasBuyAndInstall;
  }

  /** Toggles selection of an item, enforcing type consistency */
  toggleSelection(idx: number) {
    const item = this.cartItems[idx];
    this.validationError = null;

    if (this.selectedIndices.length === 0) {
      // First selection
      this.selectedIndices.push(idx);
      this.activeType = item.purchaseType;
    } else if (item.purchaseType === this.activeType) {
      // Correct type selection
      const sIdx = this.selectedIndices.indexOf(idx);
      if (sIdx > -1) {
        this.selectedIndices.splice(sIdx, 1);
        if (this.selectedIndices.length === 0) this.activeType = null;
      } else {
        this.selectedIndices.push(idx);
      }
    } else {
      // Incorrect type attempt
      this.validationError = "You can't select Buy Only item and a Buy & Install item together";
    }
  }

  isSelected(idx: number): boolean {
    return this.selectedIndices.includes(idx);
  }

  isDimmed(item: any): boolean {
    return this.activeType !== null && item.purchaseType !== this.activeType;
  }

  onProceedCheckout() {
    if (this.selectedIndices.length === 0) {
      this.validationError = "You need to first select one type of items to checkout";
      return;
    }
    
    // For now, we'll navigate to checkout. 
    // In a real app, we'd pass the selected item IDs in navigation state or similar.
    const selectedIds = this.selectedIndices.map(i => this.cartItems[i].productId.toString());
    this.router.navigate(['/checkout'], { state: { selectedItems: selectedIds } });
  }

  dismissValidationError() {
    this.validationError = null;
  }
}