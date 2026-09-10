import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CsaTicketService, ServiceTicket } from '../../services/csa-ticket.service';
import { CsaCustomerService, CustomerProfile } from '../../services/csa-customer.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { CsaRequestServiceModalComponent } from '../../components/csa-request-service-modal/csa-request-service-modal.component';

@Component({
  selector: 'app-csa-service-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PortalIconsModule, CsaRequestServiceModalComponent],
  templateUrl: './csa-service-tickets.component.html',
  styleUrl: './csa-service-tickets.component.css'
})
export class CsaServiceTicketsComponent implements OnInit {
  tickets: ServiceTicket[] = [];
  rawTickets: ServiceTicket[] = [];
  rawRepairs: any[] = [];
  rawMaintenances: any[] = [];
  rawInstallations: any[] = [];
  rawInspections: any[] = [];
  customers: CustomerProfile[] = [];
  products: any[] = [];
  totalTickets = 0;
  
  // Category Counts for Summary Cards
  countTotal = 0;
  countRepairs = 0;
  countMaintenance = 0;
  countInstallations = 0;
  countInspections = 0;

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

  // Details Modal (Read-Only)
  showDetailsModal = false;
  selectedTicket: ServiceTicket | null = null;

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
      acUnitModel: ['', [Validators.required, Validators.minLength(2)]],
      acUnitSerial: ['', [Validators.required, Validators.minLength(2)]],
      preferredDate: ['', Validators.required],
      preferredTimeSlot: ['', Validators.required],
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

  /**
   * Fetches all 4 categories from the live technician dashboard collections:
   * 1. Repairs: /api/service-requests
   * 2. Maintenance: /api/maintenance
   * 3. Installations: /api/installations
   * 4. Inspections: /api/inspections
   * Along with existing CSA-created tickets.
   */
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
      repairRes: this.ticketService.getServiceRequests().pipe(
        catchError((err) => {
          console.error('Failed to load repair requests:', err);
          return of({ success: false, data: [] });
        })
      ),
      maintenanceRes: this.ticketService.getMaintenanceTickets().pipe(
        catchError((err) => {
          console.error('Failed to load maintenance records:', err);
          return of({ success: false, data: [], count: 0 });
        })
      ),
      installationRes: this.ticketService.getInstallations().pipe(
        catchError((err) => {
          console.error('Failed to load installation records:', err);
          return of({ success: false, data: [] });
        })
      ),
      inspectionRes: this.ticketService.getInspections().pipe(
        catchError((err) => {
          console.error('Failed to load inspection records:', err);
          return of({ success: false, data: [] });
        })
      )
    }).subscribe({
      next: ({ ticketRes, repairRes, maintenanceRes, installationRes, inspectionRes }) => {
        this.isLoading = false;

        this.rawTickets = (ticketRes && ticketRes.success) ? (ticketRes.tickets || []) : [];
        this.rawRepairs = (repairRes && repairRes.success) ? (repairRes.data || []) : [];
        this.rawMaintenances = (maintenanceRes && maintenanceRes.success) ? (maintenanceRes.data || []) : [];
        this.rawInstallations = (installationRes && installationRes.success) ? (installationRes.data || []) : [];
        this.rawInspections = (inspectionRes && inspectionRes.success) ? (inspectionRes.data || []) : [];

        this.calculateStats();
        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load portal data:', err);
        this.errorMessage = 'Failed to load technician records and tickets. Please refresh.';
      }
    });
  }

  private mapRepairToTicket(r: any): ServiceTicket {
    const rawId = r.serviceRequestRef || r.ticketId || (r._id ? `SRQ-${r._id.slice(-4).toUpperCase()}` : 'SRQ-1001');
    const formattedId = String(rawId).startsWith('#') ? String(rawId) : `#${rawId}`;
    const cust = r.customerId && typeof r.customerId === 'object' ? r.customerId : {};
    const custName = r.fullName || r.customerName || cust.fullName || cust.name || 'Customer';
    const custAddress = cust.address || r.location || 'N/A';
    const custPhone = cust.phoneNumber || cust.contactNo || cust.phone || r.contactNo || '';
    const custEmail = cust.email || r.customerEmail || '';
    const product = r.productType || r.acUnitModel || 'AirLux AC';
    const team = typeof r.assignedTeam === 'object'
      ? (r.assignedTeam?.teamName || 'Unassigned')
      : (r.assignedTeam || r.assignedTeamName || 'Unassigned');
    const status = r.status === 'Scheduled' ? 'Assigned' : (r.status || 'New');

    return {
      _id: r._id,
      ticketId: formattedId,
      isTechnicalRecord: true,
      assignedTeam: team,
      rawRecord: r,
      customerId: {
        _id: cust._id || (typeof r.customerId === 'string' ? r.customerId : ''),
        fullName: custName,
        email: custEmail,
        phoneNumber: custPhone,
        address: custAddress
      },
      category: 'repair',
      requestType: r.repairType || 'Repair Request',
      subject: r.issue || r.subject || `Repair - ${product}`,
      description: r.problemDescription || r.description || `Repair required for ${product} at ${custAddress}. Assigned Team: ${team}.`,
      priority: (r.priority || 'medium').toLowerCase() as any,
      status: status,
      acUnitModel: product,
      acUnitSerial: r.acUnitSerial || '',
      preferredDate: r.serviceDate || r.date || r.createdAt,
      preferredTimeSlot: r.preferredTimeSlot || 'Standard Slot',
      createdAt: r.createdAt || r.serviceDate || new Date().toISOString()
    };
  }

  private mapMaintenanceToTicket(m: any): ServiceTicket {
    const rawId = m.ticketId || (m._id ? `MS-${m._id.slice(-4).toUpperCase()}` : 'MS-1001');
    const formattedId = String(rawId).startsWith('#') ? String(rawId) : `#${rawId}`;
    const cust = m.customerId && typeof m.customerId === 'object' ? m.customerId : {};
    const custName = m.fullName || m.customerName || cust.fullName || 'Customer';
    const custAddress = m.location || cust.address || 'N/A';
    const custPhone = m.customerPhone || cust.phoneNumber || cust.phone || '';
    const custEmail = m.customerEmail || cust.email || '';
    const product = m.productType || m.acUnitModel || 'AirLux AC';
    const maintenanceType = m.maintenanceType || (m.isCustomerInitiated ? 'Customer Initiated' : 'Company Initiated');
    const team = m.assignedTeam || 'Maintenance Team';

    return {
      _id: m._id,
      ticketId: formattedId,
      isMaintenanceRecord: true,
      isTechnicalRecord: true,
      maintenanceRecordData: m,
      assignedTeam: team,
      rawRecord: m,
      customerId: {
        _id: cust._id || (typeof m.customerId === 'string' ? m.customerId : ''),
        fullName: custName,
        email: custEmail,
        phoneNumber: custPhone,
        address: custAddress
      },
      category: 'maintenance',
      requestType: maintenanceType,
      subject: `Maintenance - ${product}`,
      description: m.description || m.scheduledServiceType || `${maintenanceType} Maintenance for ${product} at ${custAddress}. Assigned Team: ${team}.`,
      priority: 'medium',
      status: m.status || 'New',
      acUnitModel: product,
      preferredDate: m.date || m.createdAt,
      preferredTimeSlot: m.scheduledServiceType || 'Scheduled Routine',
      createdAt: m.createdAt || m.date || new Date().toISOString()
    };
  }

  private mapInstallationToTicket(item: any): ServiceTicket {
    const rawId = item.ticketId || (item._id ? `INT-${item._id.slice(-4).toUpperCase()}` : 'INT-1001');
    const formattedId = String(rawId).startsWith('#') ? String(rawId) : `#${rawId}`;
    const cust = item.customerId && typeof item.customerId === 'object' ? item.customerId : {};
    const custName = item.fullName || item.customerName || cust.fullName || cust.name || 'Customer';
    const custAddress = cust.address || item.location || 'N/A';
    const custPhone = cust.phoneNumber || cust.phone || item.customerPhone || '';
    const custEmail = cust.email || item.customerEmail || '';
    const product = item.productType || item.itemName || item.acUnitModel || 'AirLux AC System';
    const team = typeof item.assignedTeam === 'object'
      ? (item.assignedTeam?.teamName || 'Unassigned')
      : (item.assignedTeam || item.assignedTeamName || 'Unassigned');

    return {
      _id: item._id,
      ticketId: formattedId,
      isTechnicalRecord: true,
      assignedTeam: team,
      rawRecord: item,
      customerId: {
        _id: cust._id || (typeof item.customerId === 'string' ? item.customerId : ''),
        fullName: custName,
        email: custEmail,
        phoneNumber: custPhone,
        address: custAddress
      },
      category: 'installation',
      requestType: 'Unit Installation',
      subject: `Installation - ${product}`,
      description: item.description || item.notes || `Installation of ${product} at ${custAddress}. Assigned Team: ${team}.`,
      priority: 'medium',
      status: item.status || 'Assigned',
      acUnitModel: product,
      preferredDate: item.date || item.serviceDate || item.createdAt,
      preferredTimeSlot: item.timeSlot || 'Scheduled Slot',
      createdAt: item.createdAt || item.date || new Date().toISOString()
    };
  }

  private mapInspectionToTicket(ins: any): ServiceTicket {
    const rawId = ins.ticketId || ins.ticketRef || (ins._id ? `INS-${ins._id.slice(-5).toUpperCase()}` : 'INS-00001');
    const formattedId = String(rawId).startsWith('#') ? String(rawId) : `#${rawId}`;
    const cust = ins.customerId && typeof ins.customerId === 'object' ? ins.customerId : {};
    const custName = ins.customerName || cust.fullName || cust.name || 'Customer';
    const custAddress = cust.address || ins.location || 'N/A';
    const custPhone = cust.phoneNumber || cust.phone || ins.customerPhone || '';
    const custEmail = cust.email || ins.customerEmail || '';
    const product = ins.productType || (ins.orderId && (ins.orderId.itemName || ins.orderId.productType)) || 'Site Inspection';
    const team = ins.assignedTeam || 'Inspection Team';
    const status = String(ins.status || '') === 'Scheduled' ? 'Assigned' : (ins.status || 'Assigned');

    return {
      _id: ins._id,
      ticketId: formattedId,
      isTechnicalRecord: true,
      assignedTeam: team,
      rawRecord: ins,
      customerId: {
        _id: cust._id || (typeof ins.customerId === 'string' ? ins.customerId : ''),
        fullName: custName,
        email: custEmail,
        phoneNumber: custPhone,
        address: custAddress
      },
      category: 'inspection',
      requestType: 'Site Inspection',
      subject: `Inspection - ${product}`,
      description: ins.description || ins.notes || `Site inspection for ${product} at ${custAddress}. Assigned Team: ${team}.`,
      priority: 'medium',
      status: status,
      acUnitModel: product,
      preferredDate: ins.date || ins.scheduledDate || ins.createdAt,
      preferredTimeSlot: ins.timeSlot || 'Scheduled Inspection',
      createdAt: ins.createdAt || ins.date || new Date().toISOString()
    };
  }

  getDisplaySubject(ticket: ServiceTicket | null | undefined): string {
    if (!ticket || !ticket.subject) return 'Service Request';
    let subject = ticket.subject;
    // Strip redundant bracketed ticket ID e.g. (#SRQ-1007), (SRQ-1007), (#MS-1008), (#INT-1013), etc.
    subject = subject.replace(/\s*\(\s*#?[A-Za-z0-9_-]+\s*\)\s*/g, ' ');
    return subject.replace(/\s{2,}/g, ' ').trim() || 'Service Request';
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
    const mappedRepairs = this.rawRepairs.map(r => this.mapRepairToTicket(r));
    const mappedMaintenances = this.rawMaintenances.map(m => this.mapMaintenanceToTicket(m));
    const mappedInstallations = this.rawInstallations.map(i => this.mapInstallationToTicket(i));
    const mappedInspections = this.rawInspections.map(ins => this.mapInspectionToTicket(ins));

    const knownIds = new Set<string>();
    const allTickets: ServiceTicket[] = [];

    const addTicket = (ticket: ServiceTicket) => {
      const cleanId = (ticket.ticketId || ticket._id || '').replace('#', '').trim().toUpperCase();
      if (cleanId && knownIds.has(cleanId)) {
        return;
      }
      if (cleanId) {
        knownIds.add(cleanId);
      }
      allTickets.push(ticket);
    };

    // Add all live technician tickets first
    mappedRepairs.forEach(addTicket);
    mappedMaintenances.forEach(addTicket);
    mappedInstallations.forEach(addTicket);
    mappedInspections.forEach(addTicket);

    // Add any CSA-created tickets not already covered
    for (const t of this.rawTickets) {
      const anyT = t as any;
      const ref = anyT.serviceRequestRef || (anyT.ticketId ? anyT.ticketId.replace('#', '') : (t._id || ''));
      const cleanRef = ref.trim().toUpperCase();

      if (cleanRef && knownIds.has(cleanRef)) {
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

      let reqType = anyT.maintenanceType || t.requestType;
      if (category === 'maintenance') {
        if (!reqType || reqType.toLowerCase() === 'maintenance') {
          reqType = 'Company Initiated';
        }
      }

      addTicket({
        ...t,
        category: category as any,
        requestType: reqType,
        ticketId: displayTicketId
      });
    }

    // Sort by date descending
    return allTickets.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.preferredDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.preferredDate || 0).getTime();
      return dateB - dateA;
    });
  }

  applyFilters(): void {
    const allUnified = this.getUnifiedTickets();
    let combined: ServiceTicket[] = [];

    // Category Filter
    if (this.selectedCategory === 'ALL') {
      combined = allUnified;
    } else {
      combined = allUnified.filter(t => (t.category || '').toLowerCase() === this.selectedCategory.toLowerCase());
    }

    // Status Filter
    if (this.selectedStatus !== 'ALL') {
      combined = combined.filter(t => {
        const s = (t.status || '').toLowerCase();
        const target = this.selectedStatus.toLowerCase();
        if (target === 'resolved' || target === 'completed') {
          return s === 'resolved' || s === 'completed' || s === 'sent to customer';
        }
        if (target === 'new' || target === 'pending') {
          return s === 'new' || s === 'pending';
        }
        if (target === 'assigned' || target === 'in progress') {
          return s === 'assigned' || s === 'in-progress' || s === 'in progress' || s === 'finance approved' || s === 'materials ready' || s === 'scheduled';
        }
        return s === target;
      });
    }

    // Search Filter
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
        const team = (t.assignedTeam || '').toLowerCase();

        return subj.includes(q) || desc.includes(q) || model.includes(q) || tId.includes(q) || custName.includes(q) || custPhone.includes(q) || location.includes(q) || team.includes(q);
      });
    }

    this.tickets = combined;
    this.totalTickets = combined.length;
  }

  calculateStats(): void {
    const allUnified = this.getUnifiedTickets();

    this.countTotal = allUnified.length;
    this.countRepairs = allUnified.filter(t => (t.category || '').toLowerCase() === 'repair').length;
    this.countMaintenance = allUnified.filter(t => (t.category || '').toLowerCase() === 'maintenance').length;
    this.countInstallations = allUnified.filter(t => (t.category || '').toLowerCase() === 'installation').length;
    this.countInspections = allUnified.filter(t => (t.category || '').toLowerCase() === 'inspection').length;
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
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onServiceRequestCreated(req: any): void {
    const ref = req?.serviceRequestRef || 'Request';
    this.showToast(`Service Request ${ref} created successfully!`);
    this.loadAllData();
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
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTicket = null;
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
