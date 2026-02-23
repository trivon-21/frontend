import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, TrackedOrder } from '../../services/order.service';

interface TimelineStep {
  label: string;
  key: string;
}

const BUY_ONLY_STEPS: TimelineStep[] = [
  { label: 'Order Placed', key: 'Order Placed' },
  { label: 'Payment Uploaded', key: 'Payment Uploaded' },
  { label: 'Payment Confirmed', key: 'Payment Confirmed' },
  { label: 'Inventory Approved', key: 'Inventory Approved' },
  { label: 'Shipped', key: 'Shipped' },
  { label: 'Delivered', key: 'Delivered' },
];

const BUY_INSTALL_STEPS: TimelineStep[] = [
  ...BUY_ONLY_STEPS,
  { label: 'Installation Scheduled', key: 'Installation Scheduled' },
  { label: 'Installation Completed', key: 'Installation Completed' },
];

const STATUS_ORDER = [
  'Order Placed', 'Payment Uploaded', 'Payment Confirmed', 'Inventory Approved',
  'Shipped', 'Delivered', 'Installation Scheduled', 'Installation Completed'
];

@Component({
  selector: 'app-track-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './track-order-modal.component.html',
  styleUrl: './track-order-modal.component.css',
})
export class TrackOrderModalComponent {
  @Output() closed = new EventEmitter<void>();

  searchRef = '';
  searchPhone = '';
  searchEmail = '';

  loading = false;
  error: string | null = null;
  order: TrackedOrder | null = null;

  constructor(private orderService: OrderService) {}

  close() {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  search() {
    if (!this.searchRef.trim()) {
      this.error = 'Please enter an order reference number.';
      return;
    }
    this.error = null;
    this.loading = true;
    this.order = null;

    this.orderService
      .trackOrder(this.searchRef, this.searchPhone || undefined, this.searchEmail || undefined)
      .subscribe({
        next: (o) => {
          this.order = o;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Order not found. Please check your reference number.';
          this.loading = false;
        },
      });
  }

  resetSearch() {
    this.order = null;
    this.error = null;
    this.searchRef = '';
    this.searchPhone = '';
    this.searchEmail = '';
  }

  getSteps(): TimelineStep[] {
    return this.order?.orderType === 'Buy & Install' ? BUY_INSTALL_STEPS : BUY_ONLY_STEPS;
  }

  getStepState(stepKey: string): 'done' | 'active' | 'pending' {
    if (!this.order) return 'pending';
    const currentIdx = STATUS_ORDER.indexOf(this.order.orderStatus);
    const stepIdx = STATUS_ORDER.indexOf(stepKey);
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  formatAmount(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  getPaymentStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Pending Payment': 'badge--purple',
      'Under Review': 'badge--orange',
      'Confirmed': 'badge--green',
      'Rejected': 'badge--red',
    };
    return map[status] || '';
  }

  canCancel(): boolean {
    if (!this.order) return false;
    return !['Shipped', 'Delivered', 'Installation Scheduled', 'Installation Completed'].includes(this.order.orderStatus);
  }

  canReupload(): boolean {
    return this.order?.paymentStatus === 'Rejected';
  }

  cancelOrder() {
    if (!this.order || !confirm('Are you sure you want to cancel this order?')) return;
    this.orderService.cancelOrder(this.order.id).subscribe({
      next: () => {
        if (this.order) {
          this.order.status = 'Returned';
          this.order.orderStatus = 'Order Placed';
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Could not cancel order.');
      },
    });
  }

  warrantyActive(): boolean {
    if (!this.order?.warrantyExpiry) return false;
    return new Date(this.order.warrantyExpiry) > new Date();
  }
}
