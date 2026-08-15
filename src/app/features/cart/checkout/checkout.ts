import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartResponse, DisplayCartItem } from '../pages/cart.service';
import { OrderService } from './order.service';
import { PaymentService, BankDetails } from '../../../core/services/payment.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  // User ID
  userId: string = '';
  username: string = '';

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

  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);

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
    this.userId = localStorage.getItem('userId') || 'demo-user';
    this.username = localStorage.getItem('username') || 'Customer';

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
        this.uploadError = 'Only PNG, JPG, JPEG and PDF files are allowed';
        this.removeFile();
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 5MB';
        this.removeFile();
        return;
      }
      this.selectedFile = file;
      this.uploadError = '';

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
    const formData = new FormData();
    formData.append('orderReference', this.generatedOrderId);
    
    // Append all form values
    Object.keys(this.shippingForm.value).forEach(key => {
      formData.append(key, this.shippingForm.value[key]);
    });
    
    if (this.selectedFile) {
      formData.append('slip', this.selectedFile);
    }

    this.orderService.submitPayment(formData).subscribe({
      next: (res) => {
        this.router.navigate(['/order-success'], { 
          state: { 
            orderId: this.generatedOrderId,
            isBuyAndInstall: !this.isBuyOnly
          } 
        });
      },
      error: (err) => {
        console.error('Finalization failed:', err);
        alert('Failed to submit payment: ' + (err.error?.message || err.message));
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
