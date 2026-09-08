import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CsaTicketService, ServiceTicket, MaintenanceSchedule } from '../../services/csa-ticket.service';
import { CsaCustomerService, CustomerProfile } from '../../services/csa-customer.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-csa-service-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PortalIconsModule],
  templateUrl: './csa-service-tickets.component.html',
  styleUrl: './csa-service-tickets.component.css'
})
export class CsaServiceTicketsComponent implements OnInit {
  tickets: ServiceTicket[] = [];
  rawTickets: ServiceTicket[] = [];
  rawMaintenances: any[] = [];
  customers: CustomerProfile[] = [];
  products: any[] = [];
  totalTickets = 0;
  
  // Status Filter Counts
  countTotal = 0;
  countNew = 0;
  countAssigned = 0;
  countResolved = 0;
  countPendingCSA = 0;

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
      maintenanceRes: this.ticketService.getMaintenanceTickets().pipe(
        catchError((err) => {
          console.error('Failed to load maintenance records:', err);
          return of({ success: false, data: [], count: 0 });
        })
      )
    }).subscribe({
      next: ({ ticketRes, maintenanceRes }) => {
        this.isLoading = false;

        this.rawTickets = (ticketRes && ticketRes.success) ? (ticketRes.tickets || []) : [];
        this.rawMaintenances = (maintenanceRes && maintenanceRes.success) ? (maintenanceRes.data || []) : [];

        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load portal data:', err);
        this.errorMessage = 'Failed to load tickets and maintenance records. Please refresh.';
      }
    });
  }

  private mapMaintenanceToTicket(m: any): ServiceTicket {
    const rawId = m.ticketId || (m._id ? `M-${m._id.slice(-4).toUpperCase()}` : 'M-1001');
    const formattedId = rawId.startsWith('#') ? rawId : `#${rawId}`;
    const cust = m.customerId && typeof m.customerId === 'object' ? m.customerId : {};
    const custName = m.fullName || m.customerName || cust.fullName || 'Customer';
    const custAddress = m.location || cust.address || 'N/A';
    const custPhone = m.customerPhone || cust.phoneNumber || cust.phone || '';
    const custEmail = m.customerEmail || cust.email || '';
    const product = m.productType || m.acUnitModel || 'AirLux AC';
    const maintenanceType = m.maintenanceType || (m.isCustomerInitiated ? 'Customer Initiated' : 'Company Initiated');

    return {
      _id: m._id,
      ticketId: formattedId,
      isMaintenanceRecord: true,
      maintenanceRecordData: m,
      customerId: {
        _id: cust._id || (typeof m.customerId === 'string' ? m.customerId : ''),
        fullName: custName,
        email: custEmail,
        phoneNumber: custPhone,
        address: custAddress
      },
      category: 'maintenance',
      requestType: maintenanceType,
      subject: `Maintenance (${formattedId}) - ${product}`,
      description: m.description || m.scheduledServiceType || `${maintenanceType} Maintenance for ${product} at ${custAddress}. Assigned Team: ${m.assignedTeam || 'Not Assigned'}.`,
      priority: 'medium',
      status: m.status || 'New',
      acUnitModel: product,
      preferredDate: m.date || m.createdAt,
      preferredTimeSlot: m.scheduledServiceType || 'Scheduled Routine',
      createdAt: m.createdAt || m.date || new Date().toISOString()
    };
  }

  getFormattedTicketId(ticket: ServiceTicket | null | undefined): string {
    if (!ticket) return '';
    const anyT = ticket as any;
    if (anyT.serviceRequestRef) {
      return anyT.serviceRequestRef.startsWith('#') ? anyT.serviceRequestRef : `#${anyT.serviceRequestRef}`;
    }
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

  private getUnifiedTickets(): ServiceTicket[] {
    const mappedMaintenances = this.rawMaintenances.map(m => this.mapMaintenanceToTicket(m));
    const maintenanceTicketIds = new Set(
      mappedMaintenances.map(m => (m.ticketId || '').replace('#', '').trim().toUpperCase())
    );

    const normalizedTickets: ServiceTicket[] = [];

    for (const t of this.rawTickets) {
      const anyT = t as any;
      const ref = anyT.serviceRequestRef || (anyT.ticketId ? anyT.ticketId.replace('#', '') : '');
      const refUpper = ref ? ref.trim().toUpperCase() : '';

      // Skip duplicate if this maintenance ticket is already present from the live maintenance collection
      if (refUpper && maintenanceTicketIds.has(refUpper)) {
        continue;
      }

      let category = (t.category || '').toLowerCase();
      if (!category) {
        const servType = (anyT.serviceType || '').toLowerCase();
        const subj = (t.subject || '').toLowerCase();
        if (servType === 'maintenance' || subj.includes('maintenance')) {
          category = 'maintenance';
        } else if (servType === 'installation' || subj.includes('installation')) {
          category = 'installation';
        } else if (servType === 'inspection' || subj.includes('inspection')) {
          category = 'inspection';
        } else {
          category = 'repair';
        }
      }

      let displayTicketId = t.ticketId;
      if (anyT.serviceRequestRef) {
        displayTicketId = anyT.serviceRequestRef.startsWith('#')
          ? anyT.serviceRequestRef
          : `#${anyT.serviceRequestRef}`;
      }

      normalizedTickets.push({
        ...t,
        category: category as any,
        ticketId: displayTicketId
      });
    }

    return [...normalizedTickets, ...mappedMaintenances];
  }

  applyFilters(): void {
    const allUnified = this.getUnifiedTickets();
    let combined: ServiceTicket[] = [];

    if (this.selectedCategory === 'ALL') {
      combined = allUnified;
    } else {
      combined = allUnified.filter(t => (t.category || '').toLowerCase() === this.selectedCategory.toLowerCase());
    }

    // Apply Status Filter
    if (this.selectedStatus !== 'ALL') {
      combined = combined.filter(t => {
        const s = (t.status || '').toLowerCase();
        const target = this.selectedStatus.toLowerCase();
        if (target === 'resolved') {
          return s === 'resolved' || s === 'completed' || s === 'sent to customer';
        }
        if (target === 'new') {
          return s === 'new' || s === 'pending';
        }
        if (target === 'assigned') {
          return s === 'assigned' || s === 'in-progress' || s === 'in progress' || s === 'finance approved' || s === 'materials ready' || s === 'scheduled';
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
    const allUnified = this.getUnifiedTickets();
    let baseList: ServiceTicket[] = [];

    if (this.selectedCategory === 'ALL') {
      baseList = allUnified;
    } else {
      baseList = allUnified.filter(t => (t.category || '').toLowerCase() === this.selectedCategory.toLowerCase());
    }

    this.countTotal = baseList.length;
    this.countNew = baseList.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'new' || s === 'pending';
    }).length;
    this.countAssigned = baseList.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'assigned' || s === 'in-progress' || s === 'in progress' || s === 'finance approved' || s === 'materials ready' || s === 'scheduled';
    }).length;
    this.countResolved = baseList.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'resolved' || s === 'completed' || s === 'sent to customer';
    }).length;

    this.countPendingCSA = allUnified.filter(t => {
      if ((t.category || '').toLowerCase() !== 'maintenance') return false;
      const s = (t.status || '').toLowerCase();
      return s === 'pending' || s === 'finance approved' || s === 'materials ready';
    }).length;
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  setCategoryFilter(cat: string): void {
    this.selectedCategory = cat;
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
      case 'in-progress':
      case 'in progress': return 'status-in-progress';
      case 'sent to csa': return 'status-pending-csa';
      case 'sent to customer':
      case 'completed':
      case 'resolved': return 'status-resolved';
      case 'draft saved':
      case 'on hold':
      case 'on-hold': return 'status-draft';
      case 'finance approved':
      case 'materials ready':
      case 'scheduled':
      case 'reviewed': return 'status-reviewed';
      case 'finance rejected':
      case 'cancelled':
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  }
}

