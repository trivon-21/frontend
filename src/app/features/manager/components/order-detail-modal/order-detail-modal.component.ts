import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { OrderLookupResult } from '../../services/manager-customers.service';

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule, PortalIconsModule],
  templateUrl: './order-detail-modal.component.html',
  styleUrls: ['./order-detail-modal.component.css'],
})
export class OrderDetailModalComponent {
  @Input() order: OrderLookupResult | null = null;
  @Input() visible = false;
  @Input() loading = false;
  @Input() errorMessage = '';

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible) {
      this.close();
    }
  }

  formatCurrency(value: number | undefined | null): string {
    return 'LKR ' + (Number(value) || 0).toLocaleString('en-US');
  }

  formatDate(dateStr: string | Date | undefined | null): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  }

  getCategoryBadgeClass(category: string | undefined): string {
    const c = String(category || '').toLowerCase();
    if (c.includes('inquiry')) return 'badge-cat-inquiry';
    if (c.includes('service')) return 'badge-cat-service';
    if (c.includes('installation')) return 'badge-cat-installation';
    return 'badge-cat-order';
  }

  getStatusBadgeClass(status: string | undefined): string {
    const s = String(status || '').toLowerCase();
    if (s.includes('complete') || s.includes('delivered') || s.includes('approved') || s.includes('confirmed') || s.includes('addressed')) {
      return 'status-badge--success';
    }
    if (s.includes('pending') || s.includes('review') || s.includes('progress') || s.includes('scheduled') || s.includes('awaiting') || s.includes('ongoing')) {
      return 'status-badge--warning';
    }
    if (s.includes('cancel') || s.includes('reject') || s.includes('return')) {
      return 'status-badge--danger';
    }
    return 'status-badge--neutral';
  }
}
