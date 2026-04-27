import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface MaterialItem {
  name: string;
  quantity: string;
}

interface MaterialRequest {
  id: string;
  type: 'Installation' | 'Service';
  customer: string;
  customerEmail: string;
  customerContactNo: string;
  date: string;
  location: string;
  status: 'Finance Approved' | 'New' | 'Pending Approval' | 'Pending' | 'Sent to IM';
  items: MaterialItem[];
}

type RawMaterialRequest = {
  _id?: string;
  ticketId?: string | number;
  requestType?: 'Installation' | 'Service';
  customerName?: string;
  customerEmail?: string;
  customerContactNo?: string;
  location?: string;
  serviceDate?: string;
  serviceDescription?: string;
  createdAt?: string;
  status?: MaterialRequest['status'];
  materials?: Array<{
    item?: string;
    quantity?: string;
  }>;
};

type TicketDropdownItem = {
  id: string;
  productType: string;
  serviceDescription: string;
  customerName?: string;
  customerEmail?: string;
  customerContactNo?: string;
  customerAddress?: string;
  isUnderWarranty?: boolean;
  isFreeOfCharge?: boolean;
  status?: string;
  materials?: Array<{ item?: string; quantity?: string }>;
  financeNotes?: string;
  location?: string;
  requestType?: 'Installation' | 'Service';
  siteDetails?: any;
};

@Component({
  selector: 'app-main-technician-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-materials.component.html',
  styleUrl: './main-technician-materials.component.css'})
export class MainTechnicianMaterialsComponent implements OnInit {
  searchQuery: string = '';
  statusFilter: 'All' | 'approved' | 'sent' | 'pending' | 'draft' = 'All';
  showCreateModal: boolean = false;
  newRequest = {
    ticketId: '',
    productType: '',
    description: '',
    items: [{ name: '', quantity: '' }],
    notes: '',
    isUnderWarranty: false,
    isFreeOfCharge: false,
    customerName: '',
    customerEmail: '',
    customerContactNo: '',
    customerAddress: '',
    rejectedStatus: '',
    rejectionReason: '',
    siteDetails: {} as any
  };

  get selectedTicket(): TicketDropdownItem | undefined {
    return this.dropdownTickets.find((ticket) => ticket.id === this.newRequest.ticketId);
  }

  get isInstallationTicketSelected(): boolean {
    return this.selectedTicket?.requestType === 'Installation';
  }

  get detailsFieldLabel(): string {
    return this.isInstallationTicketSelected ? 'Site Details' : 'Service Description';
  }

  requests: MaterialRequest[] = [];
  filteredRequests: MaterialRequest[] = [];
  selectedRequest: MaterialRequest | null = null;
  newStatusTicketIds: string[] = [];
  dropdownTickets: TicketDropdownItem[] = [];
  isLoading = false;
  isTicketDropdownLoading = false;
  error: string | null = null;

  private readonly apiUrl = `${environment.apiBaseUrl}/material-requests`;

  constructor(
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.loadMaterialRequests();
    this.loadNewStatusTicketIds();
  }

  private formatDisplayDate(value?: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    return value;
  }

  private normalizeTicketId(ticketId?: string | number): string {
    const normalized = String(ticketId ?? '').trim();
    if (!normalized) {
      return '#N/A';
    }
    return normalized.startsWith('#') ? normalized : `#${normalized}`;
  }

  private mapApiMaterialRequest(item: RawMaterialRequest): MaterialRequest {
    return {
      id: this.normalizeTicketId(item.ticketId || item._id),
      type: item.requestType || 'Service',
      customer: item.customerName || 'Unknown Customer',
      customerEmail: item.customerEmail || '-',
      customerContactNo: item.customerContactNo || '-',
      date: this.formatDisplayDate(item.serviceDate || item.createdAt),
      location: item.location || '-',
      status: item.status || 'New',
      items: (item.materials || []).map((material) => ({
        name: material.item || '-',
        quantity: material.quantity || '-'
      }))
    };
  }

  loadMaterialRequests(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: RawMaterialRequest[] }>(this.apiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.requests = response.data.map((item) => this.mapApiMaterialRequest(item));
            this.applyFilters();
          } else {
            this.error = 'Failed to load material requests';
            this.requests = [];
            this.filteredRequests = [];
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading material requests:', err);
          this.error = `Failed to load material requests: ${err.message || 'Unknown error'}`;
          this.requests = [];
          this.filteredRequests = [];
          this.isLoading = false;
        }
      });
  }

  loadNewStatusTicketIds(): void {
    this.isTicketDropdownLoading = true;

    this.http
      .get<{ success: boolean; data: RawMaterialRequest[] }>(`${this.apiUrl}/dropdown-tickets`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const tickets = (response.data || [])
            .map((item: any) => ({
              id: this.normalizeTicketId(item.ticketId),
              requestType: item.requestType || 'Service',
              productType: (item.productType || '').trim(),
              serviceDescription: (item.serviceDescription || '').trim(),
              customerName: (item.customerName || '').trim(),
              customerEmail: (item.customerEmail || '').trim(),
              customerContactNo: (item.customerContactNo || '').trim(),
              customerAddress: (item.customerAddress || '').trim(),
              isUnderWarranty: item.isUnderWarranty || false,
              isFreeOfCharge: item.isFreeOfCharge || false,
              status: item.status || 'New',
              materials: item.materials || [],
              financeNotes: item.financeNotes || '',
              location: item.location || '',
              siteDetails: item.siteDetails || {}
            }))
            .filter((ticket) => ticket.id !== '#N/A');

          this.dropdownTickets = tickets;
          const ids = tickets.map((ticket) => ticket.id);

          this.newStatusTicketIds = Array.from(new Set(ids));

          if (!this.newStatusTicketIds.includes(this.newRequest.ticketId)) {
            this.newRequest.ticketId = '';
            this.newRequest.productType = '';
            this.newRequest.description = '';
            this.newRequest.isUnderWarranty = false;
            this.newRequest.isFreeOfCharge = false;
            this.newRequest.customerName = '';
            this.newRequest.customerEmail = '';
            this.newRequest.customerContactNo = '';
            this.newRequest.customerAddress = '';
            this.newRequest.siteDetails = {};
          } else {
            this.syncDescriptionWithSelectedTicket(this.newRequest.ticketId);
          }

          this.isTicketDropdownLoading = false;
        },
        error: (err) => {
          console.error('Error loading New ticket IDs for dropdown:', err);

          // Fallback to currently loaded material requests if dropdown endpoint fails.
          this.newStatusTicketIds = Array.from(
            new Set(
              this.requests
                .filter((request) => request.status === 'New')
                .map((request) => request.id)
                .filter((id) => id && id !== '#N/A')
            )
          );
          this.dropdownTickets = [];

          if (!this.newStatusTicketIds.includes(this.newRequest.ticketId)) {
            this.newRequest.ticketId = '';
            this.newRequest.productType = '';
            this.newRequest.description = '';
            this.newRequest.isUnderWarranty = false;
            this.newRequest.isFreeOfCharge = false;
            this.newRequest.customerName = '';
            this.newRequest.customerEmail = '';
            this.newRequest.customerContactNo = '';
            this.newRequest.customerAddress = '';
            this.newRequest.siteDetails = {};
          } else {
            this.syncDescriptionWithSelectedTicket(this.newRequest.ticketId);
          }

          this.isTicketDropdownLoading = false;
        }
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.statusFilter = 'All';
    this.searchQuery = '';
    this.applyFilters();
  }

  applyFilters(): void {
    const normalized = this.searchQuery.toLowerCase();

    this.filteredRequests = this.requests.filter((request) => {
      const itemNames = request.items.map((item) => item.name.toLowerCase()).join(' ');
      const matchesSearch = !normalized || (
        request.id.toLowerCase().includes(normalized) ||
        request.type.toLowerCase().includes(normalized) ||
        request.customer.toLowerCase().includes(normalized) ||
        request.customerEmail.toLowerCase().includes(normalized) ||
        request.customerContactNo.toLowerCase().includes(normalized) ||
        request.location.toLowerCase().includes(normalized) ||
        request.status.toLowerCase().includes(normalized) ||
        request.date.toLowerCase().includes(normalized) ||
        itemNames.includes(normalized)
      );

      const requestStatusKey = this.getStatusFilterKey(request.status);
      const matchesStatus = this.statusFilter === 'All' || requestStatusKey === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (!this.selectedRequest || !this.filteredRequests.some((request) => request.id === this.selectedRequest?.id)) {
      this.selectedRequest = this.filteredRequests[0] ?? null;
    }
  }

  selectRequest(request: MaterialRequest) {
    this.selectedRequest = request;
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.loadNewStatusTicketIds();
  }

  onTicketSelectionChange(ticketId: string): void {
    this.syncDescriptionWithSelectedTicket(ticketId);
  }

  private syncDescriptionWithSelectedTicket(ticketId: string): void {
    const selectedTicket = this.dropdownTickets.find((ticket) => ticket.id === ticketId);
    this.newRequest.productType = selectedTicket?.productType || '';
    this.newRequest.description = selectedTicket?.serviceDescription || '';
    this.newRequest.isUnderWarranty = selectedTicket?.isUnderWarranty || false;
    this.newRequest.isFreeOfCharge = selectedTicket?.isFreeOfCharge || false;
    this.newRequest.customerName = selectedTicket?.customerName || '';
    this.newRequest.customerEmail = selectedTicket?.customerEmail || '';
    this.newRequest.customerContactNo = selectedTicket?.customerContactNo || '';
    this.newRequest.customerAddress = selectedTicket?.customerAddress || '';
    this.newRequest.rejectedStatus = selectedTicket?.status || '';
    this.newRequest.rejectionReason = selectedTicket?.financeNotes || '';
    this.newRequest.siteDetails = selectedTicket?.siteDetails || {};
    
    // Populate materials if this is a rejected request
    if (selectedTicket?.status === 'Finance Rejected' && selectedTicket?.materials && selectedTicket.materials.length > 0) {
      this.newRequest.items = selectedTicket.materials.map((material) => ({
        name: material.item || '',
        quantity: material.quantity || ''
      }));
    } else {
      // Reset to empty for new requests
      this.newRequest.items = [{ name: '', quantity: '' }];
    }
  }

  private resetCreateForm(): void {
    this.newRequest = {
      ticketId: '',
      productType: '',
      description: '',
      items: [{ name: '', quantity: '' }],
      notes: '',
      isUnderWarranty: false,
      isFreeOfCharge: false,
      customerName: '',
      customerEmail: '',
      customerContactNo: '',
      customerAddress: '',
      rejectedStatus: '',
      rejectionReason: '',
      siteDetails: {}
    };
  }

  addItem() {
    this.newRequest.items.push({ name: '', quantity: '' });
  }

  removeItem(index: number) {
    this.newRequest.items.splice(index, 1);
  }

  submitToFinance(): void {
    const normalizedTicketId = this.newRequest.ticketId.replace(/^#/, '');
    const selectedTicket = this.dropdownTickets.find((ticket) => ticket.id === this.newRequest.ticketId);
    const materials = this.newRequest.items
      .map((item) => ({
        item: (item.name || '').trim(),
        quantity: (item.quantity || '').trim()
      }))
      .filter((item) => item.item && item.quantity);

    if (!normalizedTicketId) {
      this.error = 'Please select a service ticket.';
      return;
    }

    if (materials.length === 0) {
      this.error = 'Please add at least one material item with quantity.';
      return;
    }

    this.error = null;

    this.http
      .post<{ success: boolean; message?: string; error?: string }>(`${this.apiUrl}/submit-to-finance`, {
        newRequestId: normalizedTicketId,
        ticketId: normalizedTicketId,
        customerName: this.newRequest.customerName,
        customerEmail: this.newRequest.customerEmail,
        customerContactNo: this.newRequest.customerContactNo,
        customerAddress: this.newRequest.customerAddress,
        materials,
        financeNotes: this.newRequest.notes,
        isUnderWarranty: this.newRequest.isUnderWarranty,
        isFreeOfCharge: this.newRequest.isFreeOfCharge
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.error = response.error || response.message || 'Failed to submit material request.';
            return;
          }

          this.showCreateModal = false;
          this.resetCreateForm();

          // Refresh both datasets so NewRequest disappears and a Pending material request appears.
          this.loadMaterialRequests();
          this.loadNewStatusTicketIds();
        },
        error: (err) => {
          console.error('Error submitting material request to finance:', err);
          this.error = `Failed to submit to finance: ${err.message || 'Unknown error'}`;
        }
      });
  }

  sendToInventoryManager(): void {
    if (!this.selectedRequest || this.selectedRequest.status !== 'Finance Approved') {
      return;
    }

    const ticketId = this.selectedRequest.id.replace(/^#/, '');
    
    // Prepare the data to send to inventory manager
    const inventoryManagerData = {
      serviceRequestId: ticketId,
      customerName: this.selectedRequest.customer,
      customerEmail: this.selectedRequest.customerEmail,
      customerContactNo: this.selectedRequest.customerContactNo,
      location: this.selectedRequest.location,
      materials: this.selectedRequest.items.map((item) => ({
        item: item.name,
        quantity: item.quantity
      }))
    };

    this.http
      .patch<{ success: boolean }>(`${this.apiUrl}/${encodeURIComponent(ticketId)}/send-to-im`, inventoryManagerData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            return;
          }

          this.requests = this.requests.map((request) =>
            request.id === this.selectedRequest?.id
              ? { ...request, status: 'Sent to IM' }
              : request
          );
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error sending request to inventory manager:', err);
          this.error = `Failed to send request to Inventory Manager: ${err.message || 'Unknown error'}`;
        }
      });
  }

  getCountByStatus(statuses: MaterialRequest['status'][]): number {
    return this.requests.filter((request) => statuses.includes(request.status)).length;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Finance Approved': return 'approved';
      case 'New': return 'draft';
      case 'Pending':
      case 'Pending Approval': return 'pending';
      case 'Sent to IM': return 'im';
      default: return '';
    }
  }

  private getStatusFilterKey(status: MaterialRequest['status']): 'approved' | 'draft' | 'pending' | 'sent' {
    switch (status) {
      case 'Finance Approved':
        return 'approved';
      case 'New':
        return 'draft';
      case 'Pending':
      case 'Pending Approval':
        return 'pending';
      case 'Sent to IM':
        return 'sent';
    }
  }
}

