import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { OrderDetailModalComponent } from '../../components/order-detail-modal/order-detail-modal.component';
import {
  ManagerCustomersService,
  CustomerDirectoryItem,
  CustomerSummaryKPI,
  CustomerDetailData,
  CustomerFilterQuery,
  CustomerInstance,
  OrderLookupResult,
} from '../../services/manager-customers.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface FilterOption {
  key: string;
  label: string;
}

@Component({
  selector: 'app-manager-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, OrderDetailModalComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
})
export class CustomersComponent implements OnInit {
  customers: CustomerDirectoryItem[] = [];
  summary: CustomerSummaryKPI = {
    totalCustomers: 0,
    activeCustomers: 0,
    customersWithHistory: 0,
    totalInstances: 0,
  };

  activeDetailTab: 'overview' | 'instances' = 'instances';

  // Past Order Lookup state
  orderSearchRef = '';
  selectedOrder: OrderLookupResult | null = null;
  showOrderModal = false;
  orderLoading = false;
  orderError = '';

  searchQuery = '';
  private searchSubject = new Subject<string>();

  selectedStatus = 'all';
  sortBy = 'recent';

  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  totalCount = 0;

  isLoading = false;
  errorMessage = '';

  // Detail Modal
  showDetailsModal = false;
  isLoadingDetails = false;
  selectedCustomerDetails: CustomerDetailData | null = null;
  detailError = '';

  filterOptions: FilterOption[] = [
    { key: 'all', label: 'All Customers' },
    { key: 'with-instances', label: 'With Prior Engagements' },
    { key: 'no-instances', label: 'No Prior Engagements' },
    { key: 'active', label: 'Active Accounts' },
  ];

  sortOptions = [
    { key: 'recent', label: 'Recently Registered' },
    { key: 'instances', label: 'Most Instances' },
    { key: 'name', label: 'Alphabetical' },
  ];

  constructor(private readonly customersService: ManagerCustomersService) {}

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadCustomers();
      });

    this.loadCustomers();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadCustomers();
  }

  setStatusFilter(status: string): void {
    if (this.selectedStatus === status) return;
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadCustomers();
  }

  onSortChange(): void {
    this.currentPage = 1;
    this.loadCustomers();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: CustomerFilterQuery = {
      search: this.searchQuery,
      status: this.selectedStatus,
      sortBy: this.sortBy,
      sortOrder: this.sortBy === 'name' ? 'asc' : 'desc',
      page: this.currentPage,
      limit: this.pageSize,
    };

    this.customersService.getCustomers(query).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.customers = res.customers || [];
          this.summary = res.summary || this.summary;
          if (res.pagination) {
            this.totalCount = res.pagination.total;
            this.totalPages = res.pagination.totalPages;
            this.currentPage = res.pagination.page;
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load past customers:', err);
        this.errorMessage = err.error?.message || 'Failed to load customer profiles. Please refresh.';
      },
    });
  }

  viewCustomerDetails(customer: CustomerDirectoryItem): void {
    this.selectedCustomerDetails = null;
    this.detailError = '';
    this.showDetailsModal = true;
    this.isLoadingDetails = true;

    this.customersService.getCustomerDetails(customer._id).subscribe({
      next: (res) => {
        this.isLoadingDetails = false;
        if (res && res.success) {
          this.selectedCustomerDetails = res.data;
        } else {
          this.detailError = 'Could not load customer history details.';
        }
      },
      error: (err) => {
        this.isLoadingDetails = false;
        console.error('Failed to load customer details:', err);
        this.detailError = err.error?.message || 'Failed to fetch customer history.';
      },
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCustomerDetails = null;
  }

  lookupOrder(ref?: string): void {
    const targetRef = String(ref || this.orderSearchRef || '').trim();
    if (!targetRef) return;

    this.showOrderModal = true;
    this.orderLoading = true;
    this.orderError = '';
    this.selectedOrder = null;

    this.customersService.lookupOrder(targetRef).subscribe({
      next: (res) => {
        this.orderLoading = false;
        if (res && res.success && res.data) {
          this.selectedOrder = res.data;
        } else {
          this.orderError = `Order "${targetRef}" could not be found.`;
        }
      },
      error: (err) => {
        this.orderLoading = false;
        this.orderError = err.error?.message || `Failed to find order with reference "${targetRef}".`;
      },
    });
  }

  viewInstanceOrder(instance: CustomerInstance): void {
    if (!instance || !instance.reference) return;
    this.lookupOrder(instance.reference);
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.selectedOrder = null;
    this.orderError = '';
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showOrderModal) {
      this.closeOrderModal();
    } else if (this.showDetailsModal) {
      this.closeDetailsModal();
    }
  }

  getInitials(name: string): string {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  getInstanceTypeBadgeClass(type: string): string {
    const t = String(type || '').toLowerCase();
    if (t.includes('order')) return 'badge-order';
    if (t.includes('service') || t.includes('repair')) return 'badge-service';
    if (t.includes('installation')) return 'badge-installation';
    return 'badge-inquiry';
  }

  getStatusClass(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s.includes('complete') || s.includes('delivered') || s.includes('approve') || s.includes('addressed')) return 'status-success';
    if (s.includes('progress') || s.includes('schedul') || s.includes('review') || s.includes('ongoing')) return 'status-warning';
    if (s.includes('cancel') || s.includes('reject')) return 'status-danger';
    return 'status-neutral';
  }
}
