import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

@Component({
  selector: 'app-invoice-pending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-pending.component.html',
  styleUrls: ['./invoice-pending.component.css']
})
export class InvoicePendingComponent implements OnInit {

  activeTab: 'installation' | 'repair' = 'installation';

  // Installation
  searchQuery    = '';
  selectedDate   = '';
  currentPage    = 1;
  itemsPerPage   = 8;
  totalItems     = 0;
  invoices:         any[] = [];
  filteredInvoices: any[] = [];
  selectedInvoice:  any   = null;
  showModal         = false;
  isSending         = false;
  isLoading         = false;

  // Repair
  repairSearchQuery    = '';
  repairSelectedDate   = '';
  repairCurrentPage    = 1;
  repairTotalItems     = 0;
  repairInvoices:         any[] = [];
  filteredRepairInvoices: any[] = [];
  selectedRepairInvoice:  any   = null;
  showRepairModal         = false;
  isRepairSending         = false;
  isRepairLoading         = false;

  constructor(
    private invoiceService: InvoiceService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void { this.loadInvoices(); this.loadRepairInvoices(); }

  // ── Installation ─────────────────────────────────────────────────────────────
  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getPendingInvoices().subscribe({
      next: (data) => { this.invoices = data; this.applyFilters(); this.isLoading = false; },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.filteredInvoices = this.invoices.filter(i => {
      const s = this.searchQuery.toLowerCase();
      const matchSearch = this.searchQuery
        ? i.invoiceNumber?.toLowerCase().includes(s) || i.customerName?.toLowerCase().includes(s)
        : true;
      const matchDate = this.selectedDate
        ? new Date(i.createdAt).toDateString() === new Date(this.selectedDate).toDateString() : true;
      return matchSearch && matchDate;
    });
    this.totalItems = this.filteredInvoices.length;
    this.currentPage = 1;
  }

  get paginatedInvoices() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInvoices.slice(start, start + this.itemsPerPage);
  }
  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }
  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem()   { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(p: number) { this.currentPage = p; }

  viewInvoice(invoice: any)  { this.selectedInvoice = invoice; this.showModal = true; }
  closeModal()               { this.selectedInvoice = null; this.showModal = false; }

  async sendToCustomer(): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Send Invoice',
      message: `Send invoice ${this.selectedInvoice?.invoiceNumber} to ${this.selectedInvoice?.customerEmail}?`,
      confirmText: 'Send',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isSending = true;
    this.invoiceService.sendInvoiceToCustomer(this.selectedInvoice._id).subscribe({
      next: () => {
        this.notificationService.show('Invoice PDF sent to customer email!', 'success');
        this.closeModal(); this.loadInvoices(); this.isSending = false;
      },
      error: (err) => { console.error(err); this.isSending = false; this.notificationService.show('Failed to send.', 'error'); }
    });
  }

  // ── Repair ───────────────────────────────────────────────────────────────────
  loadRepairInvoices(): void {
    this.isRepairLoading = true;
    this.invoiceService.getRepairPendingInvoices().subscribe({
      next: (data) => { this.repairInvoices = data; this.applyRepairFilters(); this.isRepairLoading = false; },
      error: (err) => { console.error(err); this.isRepairLoading = false; }
    });
  }

  applyRepairFilters(): void {
    this.filteredRepairInvoices = this.repairInvoices.filter(i => {
      const s = this.repairSearchQuery.toLowerCase();
      const matchSearch = this.repairSearchQuery
        ? i.invoiceNumber?.toLowerCase().includes(s) || i.customerName?.toLowerCase().includes(s)
        : true;
      const matchDate = this.repairSelectedDate
        ? new Date(i.createdAt).toDateString() === new Date(this.repairSelectedDate).toDateString() : true;
      return matchSearch && matchDate;
    });
    this.repairTotalItems = this.filteredRepairInvoices.length;
    this.repairCurrentPage = 1;
  }

  get paginatedRepairInvoices() {
    const start = (this.repairCurrentPage - 1) * this.itemsPerPage;
    return this.filteredRepairInvoices.slice(start, start + this.itemsPerPage);
  }
  get repairTotalPages(): number[] {
    return Array.from({ length: Math.ceil(this.repairTotalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }
  get repairStartItem() { return this.repairTotalItems === 0 ? 0 : (this.repairCurrentPage - 1) * this.itemsPerPage + 1; }
  get repairEndItem()   { return Math.min(this.repairCurrentPage * this.itemsPerPage, this.repairTotalItems); }
  repairNextPage() { if (this.repairCurrentPage * this.itemsPerPage < this.repairTotalItems) this.repairCurrentPage++; }
  repairPrevPage() { if (this.repairCurrentPage > 1) this.repairCurrentPage--; }
  repairGoToPage(p: number) { this.repairCurrentPage = p; }

  viewRepairInvoice(invoice: any)  { this.selectedRepairInvoice = invoice; this.showRepairModal = true; }
  closeRepairModal()               { this.selectedRepairInvoice = null; this.showRepairModal = false; }

  async sendRepairToCustomer(): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Send Repair Invoice',
      message: `Send invoice ${this.selectedRepairInvoice?.invoiceNumber} to ${this.selectedRepairInvoice?.customerEmail}?`,
      confirmText: 'Send',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isRepairSending = true;
    this.invoiceService.sendInvoiceToCustomer(this.selectedRepairInvoice._id).subscribe({
      next: () => {
        this.notificationService.show('Repair Invoice PDF sent to customer email!', 'success');
        this.closeRepairModal(); this.loadRepairInvoices(); this.isRepairSending = false;
      },
      error: (err) => { console.error(err); this.isRepairSending = false; this.notificationService.show('Failed to send.', 'error'); }
    });
  }
}