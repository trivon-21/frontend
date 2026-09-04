import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartResponse, DisplayCartItem } from '../pages/cart.service';
import { OrderService } from './order.service';
import { PaymentService, BankDetails } from '../../../core/services/payment.service';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../directives/click-outside.directive';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ClickOutsideDirective, FooterComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  // User ID
  userId: string = '';
  username: string = '';
  currentUser: AuthUser | null = null;
  showDropdown: boolean = false;

  // Selection from state
  selectedItemIds: string[] = [];
  isBuyOnly: boolean = false;

  // Order Summary
  cartItems: DisplayCartItem[] = [];
  subtotal: number = 0;
  additionalCharges: number = 0;
  deliveryCharge: number = 0;
  discount: number = 0;
  total: number = 0;
  
  // Generated Order Details
  generatedOrderId: string = '';
  isOrderInitialized: boolean = false;
  isInitializing: boolean = false;

  // Bank Details
  bankDetails: BankDetails = {
    bankName: 'Loading...',
    accountNumber: 'Loading...',
    accountName: 'Loading...',
    branch: 'Loading...',
    currency: 'LKR'
  };

  // Reactive Form
  shippingForm: FormGroup;
  showSummaryError: boolean = false;

  // Payment Slip
  selectedFile: File | null = null;
  filePreview: string = '';
  uploadError: string = '';
  isSubmittingPayment: boolean = false;

  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  public router = inject(Router);

  constructor() {
    // Explicitly using new FormGroup and FormControl for maximum reliability
    this.shippingForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
      lastName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
      address: new FormControl('', [Validators.required, Validators.minLength(5)]),
      city: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
      postalCode: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
      phone: new FormControl('', [Validators.required, Validators.pattern(/^0\d{9}$/)]),
      email: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)])
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.userId = user.id || (user as any)._id || '';
        this.username = user.fullName.split(' ')[0] || 'Customer';
      }
    });

    this.userId = this.currentUser ? (this.currentUser.id || (this.currentUser as any)._id || '') : '';
    this.username = this.currentUser ? this.currentUser.fullName.split(' ')[0] : 'Customer';

    // Auto-fill user information into shipping form if fields are empty
    if (this.currentUser) {
      const nameParts = (this.currentUser.fullName || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || (this.currentUser.lastName || '');
      this.shippingForm.patchValue({
        firstName: this.shippingForm.get('firstName')?.value || firstName,
        lastName: this.shippingForm.get('lastName')?.value || lastName,
        email: this.shippingForm.get('email')?.value || (this.currentUser.email || ''),
        phone: this.shippingForm.get('phone')?.value || (this.currentUser.phoneNumber || ''),
        address: this.shippingForm.get('address')?.value || (this.currentUser.address || '')
      });
    }

    const state = history.state;
    if (state) {
      if (state.selectedItems) {
        this.selectedItemIds = state.selectedItems;
      }
      if (state.scenarioOrder) {
        this.generatedOrderId = state.scenarioOrder.orderReference;
        this.isOrderInitialized = true;
      }
    }

    this.fetchCart();
    this.fetchBankDetails();
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

  // Explicitly check for errors to ensure template updates
  hasError(controlName: string, errorName: string): boolean {
    const control = this.shippingForm.get(controlName);
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }

  isInvalid(controlName: string): boolean {
    const control = this.shippingForm.get(controlName);
    // Show error if invalid AND accessible AND interacted with
    return !!(control && control.invalid && (control.dirty || control.touched) && this.isAccessible(controlName));
  }

  isAccessible(controlName: string): boolean {
    const sequence = ['firstName', 'lastName', 'address', 'city', 'postalCode', 'phone', 'email'];
    const idx = sequence.indexOf(controlName);
    if (idx <= 0) return true;
    
    const control = this.shippingForm.get(controlName);
    // Field is accessible if:
    // 1. All previous fields are valid
    // 2. OR the user has already interacted with THIS field (it's dirty or touched)
    if (control && (control.dirty || control.touched)) return true;

    return this.isPreviousValid(controlName);
  }

  isPreviousValid(controlName: string): boolean {
    const sequence = ['firstName', 'lastName', 'address', 'city', 'postalCode', 'phone', 'email'];
    const idx = sequence.indexOf(controlName);
    if (idx <= 0) return true;
    
    for (let i = 0; i < idx; i++) {
      const prevControl = this.shippingForm.get(sequence[i]);
      if (!prevControl || prevControl.invalid) return false;
    }
    return true;
  }

  getSummaryErrorMessage(): string {
    if (this.uploadError) {
      return this.uploadError;
    }
    const isShippingInvalid = this.shippingForm.invalid;
    const isSlipMissing = !this.selectedFile;

    if (isShippingInvalid && isSlipMissing) {
      return 'Please fill in all shipping details and upload your payment slip.';
    } else if (isShippingInvalid) {
      return 'Please fill in all required shipping details correctly.';
    } else if (isSlipMissing && this.isBuyOnly) {
      return 'Please upload your payment slip to complete the order.';
    }
    return '';
  }

  fetchBankDetails() {
    this.paymentService.getBankDetails().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.bankDetails = res.data;
        }
      },
      error: (err) => console.error('Failed to load bank details:', err)
    });
  }

  fetchCart() {
    this.cartService.getCart(this.userId).subscribe({
      next: (res: CartResponse) => {
        let items = res.cart.items.map(item => {
          const prod = item.product;
          const isPopulated = prod && typeof prod === 'object';
          return {
            productId: isPopulated ? prod._id.toString() : (prod?.toString() || ''),
            quantity: item.quantity,
            name: isPopulated ? (prod.name || 'Unknown Product') : 'Unknown Product',
            price: isPopulated ? (prod.price ?? 0) : 0,
            image: isPopulated ? prod.image : '',
            capacity: isPopulated ? (prod.capacity ? `${prod.capacity} BTU` : '') : '',
            purchaseType: (item.purchaseType as 'buy_only' | 'buy_and_install') || 'buy_only',
          };
        });

        if (this.selectedItemIds.length > 0) {
          items = items.filter(i => this.selectedItemIds.includes(i.productId));
        }

        this.cartItems = items;
        console.log('[Checkout] Loaded items:', this.cartItems);
        if (this.cartItems.length > 0) {
          this.isBuyOnly = !this.cartItems.some(item => item.purchaseType === 'buy_and_install');
          console.log('[Checkout] isBuyOnly:', this.isBuyOnly);
        }

        this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        this.additionalCharges = res.additionalCharges || 0; 
        this.deliveryCharge = res.deliveryCharge || 0;
        this.discount = res.discount || 0;
        this.total = (this.subtotal || 0) + (this.additionalCharges || 0) + (this.deliveryCharge || 0) - (this.discount || 0);

        if (!this.isOrderInitialized && !this.isInitializing) {
          this.initializeOrder(true);
        }
      },
      error: (err) => {
        console.error('[Checkout] Failed to load cart:', err);
        this.generatedOrderId = 'CART-LOAD-ERROR';
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.selectedFile = null;
        this.filePreview = '';
        this.uploadError = 'Only PNG, JPG, JPEG and PDF files are allowed';
        this.showSummaryError = true;
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.selectedFile = null;
        this.filePreview = '';
        this.uploadError = 'File size must be less than 5MB';
        this.showSummaryError = true;
        return;
      }
      this.selectedFile = file;
      this.uploadError = '';
      this.showSummaryError = false;

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.filePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.filePreview = ''; // Reset for PDF
      }
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.filePreview = '';
    this.uploadError = '';
    this.showSummaryError = false;
  }

  initializeOrder(silent: boolean = false) {
    const consultationCompleted = localStorage.getItem('consultationCompleted') === 'true';
    const orderData = { 
      userId: this.userId, 
      selectedItems: this.selectedItemIds,
      consultationCompleted: consultationCompleted
    };
    this.isInitializing = true;
    console.log(`[Checkout] Initializing order. Type: ${this.isBuyOnly ? 'Buy Only' : 'Buy & Install'}, data:`, orderData);
    
    let obs;
    if (this.isBuyOnly) {
      console.log('[Checkout] Calling createBuyOnlyOrder');
      obs = this.orderService.createBuyOnlyOrder(orderData);
    } else {
      console.log('[Checkout] Calling createBuyAndInstallOrder');
      obs = this.orderService.createBuyAndInstallOrder(orderData);
    }

    obs.subscribe({
      next: (res: any) => {
        this.isInitializing = false;
        const data = res?.data || res;
        this.generatedOrderId = data?.orderReference || data?.orderId || '';
        
        if (this.generatedOrderId) {
          this.isOrderInitialized = true;
          if (!silent) alert('Order initialized! Your Reference is: ' + this.generatedOrderId);
        }
      },
      error: (err) => {
        this.isInitializing = false;
        console.error('[Checkout] Auto-initialization failed:', err);
      }
    });
  }

  finalizeOrder() {
    const isSlipRequired = this.isBuyOnly;
    if (this.shippingForm.invalid || (isSlipRequired && !this.selectedFile)) {
      this.showSummaryError = true;
      // Scroll to the sidebar error
      setTimeout(() => {
        document.getElementById('sidebar-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    this.showSummaryError = false;
    this.uploadError = '';
    const formData = new FormData();
    formData.append('orderReference', this.generatedOrderId);
    
    // Append all form values
    Object.keys(this.shippingForm.value).forEach(key => {
      formData.append(key, this.shippingForm.value[key]);
    });
    
    if (this.selectedFile) {
      formData.append('slip', this.selectedFile);
    }

    this.isSubmittingPayment = true;
    this.orderService.submitPayment(formData).subscribe({
      next: (res) => {
        this.isSubmittingPayment = false;
        this.router.navigate(['/order-success'], { 
          state: { 
            orderId: this.generatedOrderId,
            isBuyAndInstall: !this.isBuyOnly
          } 
        });
      },
      error: (err) => {
        this.isSubmittingPayment = false;
        console.error('Finalization failed:', err);
        const errMsg = err.error?.message || err.message || 'Failed to submit payment';
        this.uploadError = errMsg;
        this.showSummaryError = true;
        setTimeout(() => {
          document.getElementById('sidebar-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    });
  }

  placeOrder() {
    if (this.isOrderInitialized) {
      this.finalizeOrder();
    } else if (!this.isInitializing) {
      this.initializeOrder();
    }
  }
}
