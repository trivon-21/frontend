import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CsaTicketService, ServiceTicket } from '../../services/csa-ticket.service';
import { CsaCustomerService, CustomerProfile } from '../../services/csa-customer.service';

@Component({
  selector: 'app-csa-service-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './csa-service-tickets.component.html',
  styleUrl: './csa-service-tickets.component.css'
})
export class CsaServiceTicketsComponent implements OnInit {
  tickets: ServiceTicket[] = [];
  customers: CustomerProfile[] = [];
  products: any[] = [];
  totalTickets = 0;
  
  // KPI Stats
  countTotal = 0;
  countNew = 0;
  countHighPriority = 0;
  countResolved = 0;

  // Filters
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';
  selectedPriority = 'ALL';
  searchQuery = '';

  isLoading = false;
  errorMessage = '';
  successToast = '';

  // Create Ticket Modal
  showCreateModal = false;
  ticketForm: FormGroup;
  isSubmitting = false;
  formError = '';

  // Details Modal
  showDetailsModal = false;
  selectedTicket: ServiceTicket | null = null;
  statusUpdateForm: { status: string; rejectionReason: string } = { status: '', rejectionReason: '' };
  isUpdatingStatus = false;

  constructor(
    private ticketService: CsaTicketService,
    private customerService: CsaCustomerService,
    private fb: FormBuilder
  ) {
    this.ticketForm = this.fb.group({
      customerId: ['', Validators.required],
      category: ['repair', Validators.required],
      priority: ['medium', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      acUnitModel: [''],
      acUnitSerial: [''],
      preferredDate: [''],
      preferredTimeSlot: ['Morning (9 AM - 12 PM)'],
      serviceFee: [0]
    });
  }

  ngOnInit(): void {
    this.loadTickets();
    this.loadCustomers();
    this.loadProducts();
  }

  loadProducts(): void {
    this.ticketService.getProducts().subscribe({
      next: (res) => {
        if (res && res.success) {
          this.products = res.products || [];
        }
      },
      error: (err) => console.error('Failed to load products for ticket modal:', err)
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers('', 1, 100).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.customers = res.customers || [];
        }
      },
      error: (err) => console.error('Failed to fetch customers list for ticket modal:', err)
    });
  }

  loadTickets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.ticketService.getTickets({
      search: this.searchQuery,
      category: this.selectedCategory,
      status: this.selectedStatus,
      priority: this.selectedPriority
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.tickets = res.tickets || [];
          this.totalTickets = res.total || this.tickets.length;
          this.calculateStats();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load tickets:', err);
        this.errorMessage = 'Failed to load service tickets. Please try again.';
      }
    });
  }

  calculateStats(): void {
    this.countTotal = this.totalTickets;
    this.countNew = this.tickets.filter(t => t.status === 'New').length;
    this.countHighPriority = this.tickets.filter(t => t.priority === 'high').length;
    this.countResolved = this.tickets.filter(t => t.status === 'resolved').length;
  }

  setCategoryFilter(cat: string): void {
    this.selectedCategory = cat;
    this.loadTickets();
  }

  applyFilters(): void {
    this.loadTickets();
  }

  openCreateModal(): void {
    this.ticketForm.reset({
      customerId: '',
      category: 'repair',
      priority: 'medium',
      acUnitModel: '',
      acUnitSerial: '',
      preferredTimeSlot: 'Morning (9 AM - 12 PM)',
      serviceFee: 0
    });
    this.formError = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.formError = '';

    this.ticketService.createTicket(this.ticketForm.value).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showCreateModal = false;
        this.showToast(`Service Ticket created successfully for ${res.ticket?.customerId?.fullName || 'Customer'}!`);
        this.loadTickets();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Failed to create ticket:', err);
        this.formError = err.error?.message || err.message || 'Failed to submit service ticket.';
      }
    });
  }

  viewDetails(ticket: ServiceTicket): void {
    this.selectedTicket = ticket;
    this.statusUpdateForm = { status: ticket.status, rejectionReason: ticket.rejectionReason || '' };
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTicket = null;
  }

  updateTicketStatus(): void {
    if (!this.selectedTicket || !this.statusUpdateForm.status) return;

    this.isUpdatingStatus = true;
    this.ticketService.updateTicketStatus(this.selectedTicket._id, this.statusUpdateForm).subscribe({
      next: (res) => {
        this.isUpdatingStatus = false;
        this.showToast('Ticket status updated successfully!');
        if (this.selectedTicket) {
          this.selectedTicket.status = res.ticket.status;
        }
        this.closeDetailsModal();
        this.loadTickets();
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        console.error('Failed to update ticket status:', err);
        alert('Failed to update status: ' + (err.error?.message || err.message));
      }
    });
  }

  showToast(msg: string): void {
    this.successToast = msg;
    setTimeout(() => {
      if (this.successToast === msg) {
        this.successToast = '';
      }
    }, 4000);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  getPriorityClass(priority: string): string {
    switch ((priority || '').toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'new': return 'status-new';
      case 'assigned':
      case 'in-progress': return 'status-in-progress';
      case 'resolved': return 'status-resolved';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  }
}
