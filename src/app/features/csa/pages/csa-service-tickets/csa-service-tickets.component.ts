import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CsaTicketService, ServiceTicket, MaintenanceSchedule } from '../../services/csa-ticket.service';
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
  rawTickets: ServiceTicket[] = [];
  rawSchedules: MaintenanceSchedule[] = [];
  customers: CustomerProfile[] = [];
  products: any[] = [];
  totalTickets = 0;
  
  // KPI Stats
  countTotal = 0;
  countNew = 0;
  countPendingCSA = 0;
  countResolved = 0;

  // Filters
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';
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

  // Maintenance Schedule Action
  customerNotes = '';
  isSendingToCustomer = false;

  constructor(
    private ticketService: CsaTicketService,
    private customerService: CsaCustomerService,
    private fb: FormBuilder
  ) {
    this.ticketForm = this.fb.group({
      customerId: ['', Validators.required],
      category: ['repair', Validators.required],
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
    this.loadAllData();
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

  loadAllData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      ticketRes: this.ticketService.getTickets({ limit: 100 }).pipe(
        catchError((err) => {
          console.error('Failed to load service tickets:', err);
          return of({ success: false, tickets: [], total: 0, page: 1, totalPages: 1 });
        })
      ),
      scheduleRes: this.ticketService.getMaintenanceSchedules().pipe(
        catchError((err) => {
          console.error('Failed to load maintenance schedules:', err);
          return of({ success: false, data: [], count: 0 });
        })
      )
    }).subscribe({
      next: ({ ticketRes, scheduleRes }) => {
        this.isLoading = false;

        this.rawTickets = (ticketRes && ticketRes.success) ? (ticketRes.tickets || []) : [];
        this.rawSchedules = (scheduleRes && scheduleRes.success) ? (scheduleRes.data || []) : [];

        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load portal data:', err);
        this.errorMessage = 'Failed to load tickets and schedules. Please refresh.';
      }
    });
  }

  private mapScheduleToTicket(sched: MaintenanceSchedule): ServiceTicket {
    const formattedId = sched.ticketId ? (sched.ticketId.startsWith('#') ? sched.ticketId : `#${sched.ticketId}`) : '#MS-1001';
    return {
      _id: sched._id,
      ticketId: formattedId,
      isMaintenanceSchedule: true,
      maintenanceScheduleData: sched,
      customerId: {
        _id: (sched as any).customerId?._id || '',
        fullName: sched.customerName || 'Customer',
        email: sched.customerEmail || '',
        phoneNumber: sched.customerPhone || '',
        address: sched.location || ''
      },
      category: 'maintenance',
      requestType: 'Maintenance',
      subject: `Maintenance Plan (${formattedId}) - ${sched.productType || 'AirLux AC'}`,
      description: `Technician maintenance schedule at ${sched.location || 'Location'}. Total services: ${sched.services?.length || 0}.`,
      priority: 'medium',
      status: sched.status as any,
      acUnitModel: sched.productType || 'AirLux AC',
      preferredDate: sched.installationDate,
      preferredTimeSlot: 'Quarterly Routine',
      createdAt: sched.createdAt || new Date().toISOString()
    };
  }

  getFormattedTicketId(ticket: ServiceTicket | null | undefined): string {
    if (!ticket) return '';
    if (ticket.ticketId) {
      return ticket.ticketId.startsWith('#') ? ticket.ticketId : `#${ticket.ticketId}`;
    }
    const cat = (ticket.category || 'repair').toLowerCase();
    const hex = ticket._id ? ticket._id.slice(-4).toUpperCase() : '1001';
    const num = 1000 + (parseInt(hex, 16) % 9000);
    if (cat === 'installation') {
      return `#INT-${num}`;
    } else if (cat === 'inspection') {
      return `#INS-${String(num).padStart(5, '0')}`;
    } else if (cat === 'maintenance') {
      return `#MS-${num}`;
    } else {
      return `#SRQ-${num}`;
    }
  }

  applyFilters(): void {
    const mappedSchedules = this.rawSchedules.map(s => this.mapScheduleToTicket(s));
    let combined: ServiceTicket[] = [];

    if (this.selectedCategory === 'ALL') {
      combined = [...this.rawTickets, ...mappedSchedules];
    } else if (this.selectedCategory === 'maintenance') {
      // Under maintenance: include both CSA-logged maintenance tickets and technician maintenance schedules
      const csaMaintenance = this.rawTickets.filter(t => t.category === 'maintenance');
      combined = [...csaMaintenance, ...mappedSchedules];
    } else {
      // Other categories: repairs, installations, inspections
      combined = this.rawTickets.filter(t => (t.category || '').toLowerCase() === this.selectedCategory.toLowerCase());
    }

    // Apply Status Filter
    if (this.selectedStatus !== 'ALL') {
      combined = combined.filter(t => {
        const s = (t.status || '').toLowerCase();
        const target = this.selectedStatus.toLowerCase();
        if (target === 'resolved') {
          return s === 'resolved' || s === 'sent to customer';
        }
        if (target === 'new') {
          return s === 'new' || s === 'sent to csa';
        }
        return s === target;
      });
    }

    // Apply Search Query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      combined = combined.filter(t => {
        const subj = (t.subject || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const model = (t.acUnitModel || '').toLowerCase();
        const tId = (t.ticketId || '').toLowerCase();
        const custName = (t.customerId?.fullName || '').toLowerCase();
        const custPhone = (t.customerId?.phoneNumber || '').toLowerCase();
        const location = (t.customerId?.address || '').toLowerCase();

        return subj.includes(q) || desc.includes(q) || model.includes(q) || tId.includes(q) || custName.includes(q) || custPhone.includes(q) || location.includes(q);
      });
    }

    this.tickets = combined;
    this.totalTickets = combined.length;
    this.calculateStats();
  }

  calculateStats(): void {
    const allMappedSchedules = this.rawSchedules.map(s => this.mapScheduleToTicket(s));
    const allCombined = [...this.rawTickets, ...allMappedSchedules];

    this.countTotal = allCombined.length;
    this.countNew = allCombined.filter(t => (t.status || '').toLowerCase() === 'new').length;
    this.countPendingCSA = this.rawSchedules.filter(s => s.status === 'Sent to CSA').length;
    this.countResolved = allCombined.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'resolved' || s === 'sent to customer';
    }).length;
  }

  setCategoryFilter(cat: string): void {
    this.selectedCategory = cat;
    this.applyFilters();
  }

  /** Quick-filter shortcut: clicking the "Awaiting Your Approval" KPI card
   *  jumps the agent straight to the approval queue. */
  filterByPendingCSA(): void {
    this.selectedStatus = 'New';
    this.selectedCategory = 'maintenance';
    this.applyFilters();
  }

  openCreateModal(): void {
    this.ticketForm.reset({
      customerId: '',
      category: 'repair',
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
        const custName = res.ticket?.customerId?.fullName || 'Customer';
        this.showToast(`Service Ticket created successfully for ${custName}!`);
        this.loadAllData();
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
    this.customerNotes = ticket.maintenanceScheduleData?.customerNotes || '';
    this.statusUpdateForm = { status: ticket.status, rejectionReason: ticket.rejectionReason || '' };
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTicket = null;
    this.customerNotes = '';
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
        this.loadAllData();
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        console.error('Failed to update ticket status:', err);
        alert('Failed to update status: ' + (err.error?.message || err.message));
      }
    });
  }

  sendScheduleToCustomer(): void {
    if (!this.selectedTicket || !this.selectedTicket.isMaintenanceSchedule) return;

    this.isSendingToCustomer = true;
    const scheduleId = this.selectedTicket._id;

    this.ticketService.sendMaintenanceScheduleToCustomer(scheduleId, this.customerNotes).subscribe({
      next: (res) => {
        this.isSendingToCustomer = false;
        this.showToast(`Schedule ${this.selectedTicket?.ticketId || ''} dispatched to customer successfully!`);
        if (this.selectedTicket) {
          this.selectedTicket.status = 'Sent to Customer';
          if (this.selectedTicket.maintenanceScheduleData) {
            this.selectedTicket.maintenanceScheduleData.status = 'Sent to Customer';
            this.selectedTicket.maintenanceScheduleData.customerNotes = this.customerNotes;
          }
        }
        this.closeDetailsModal();
        this.loadAllData();
      },
      error: (err) => {
        this.isSendingToCustomer = false;
        console.error('Failed to send schedule to customer:', err);
        alert('Failed to dispatch schedule to customer: ' + (err.error?.message || err.message));
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

  formatDate(dateStr: string | undefined | null): string {
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



  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'new': return 'status-new';
      case 'assigned':
      case 'in-progress': return 'status-in-progress';
      // 'Sent to CSA' = technician submitted for CSA approval — shown as "Awaiting Approval"
      case 'sent to csa': return 'status-pending-csa';
      case 'sent to customer':
      case 'resolved': return 'status-resolved';
      case 'draft saved': return 'status-draft';
      case 'reviewed': return 'status-reviewed';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  }
}

