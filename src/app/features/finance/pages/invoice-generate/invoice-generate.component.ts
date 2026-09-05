import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-invoice-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-generate.component.html',
  styleUrls: ['./invoice-generate.component.css']
})
export class InvoiceGenerateComponent implements OnInit {

  activeTab: 'installation' | 'repair' = 'installation';

  // Installation
  invoices:         any[] = [];
  searchQuery       = '';
  selectedInvoice:  any   = null;
  showDetailsModal  = false;
  isLoading         = false;

  // Repair
  repairInvoices:        any[] = [];
  repairSearchQuery      = '';
  selectedRepairInvoice: any   = null;
  showRepairDetailsModal = false;
  isRepairLoading        = false;

  constructor(private invoiceService: InvoiceService, private router: Router, private notificationService: NotificationService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void { this.loadQueue(); this.loadRepairQueue(); }

  // ── Installation ─────────────────────────────────────────────────────────────
  loadQueue(): void {
    this.isLoading = true;
    this.invoiceService.getInvoiceQueue().subscribe({
      next:  (data) => { this.invoices = data; this.isLoading = false; },
      error: (err)  => { console.error(err); this.isLoading = false; }
    });
  }

  get filteredInvoices() {
    if (!this.searchQuery.trim()) return this.invoices;
    const q = this.searchQuery.toLowerCase();
    return this.invoices.filter(i =>
      i.orderRef?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q)
    );
  }

  openDetails(invoice: any)  { this.selectedInvoice = invoice; this.showDetailsModal = true; }
  closeModal()               { this.showDetailsModal = false; this.selectedInvoice = null; }

  generateInvoice(invoice: any): void {
    this.isLoading = true;
    this.invoiceService.generateInvoice(invoice.reportId).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        this.router.navigate(['/finance/invoice/create'], { queryParams: { invoiceId: data.invoice._id } });
      },
      error: (err: any) => {
        console.error(err); this.isLoading = false;
        this.notificationService.show('Failed to generate invoice: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  onSearchQueryChange(value: string): void {
    if (this.activeTab === 'installation') {
      this.searchQuery = value;
    } else {
      this.repairSearchQuery = value;
    }
  }

  // ── Repair ───────────────────────────────────────────────────────────────────
  loadRepairQueue(): void {
    this.isRepairLoading = true;
    this.invoiceService.getRepairInvoiceQueue().subscribe({
      next:  (data) => { this.repairInvoices = data; this.isRepairLoading = false; },
      error: (err)  => { console.error(err); this.isRepairLoading = false; }
    });
  }

  get filteredRepairInvoices() {
    if (!this.repairSearchQuery.trim()) return this.repairInvoices;
    const q = this.repairSearchQuery.toLowerCase();
    return this.repairInvoices.filter(i =>
      i.ticketRef?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q)
    );
  }

  openRepairDetails(invoice: any)  { this.selectedRepairInvoice = invoice; this.showRepairDetailsModal = true; }
  closeRepairModal()               { this.showRepairDetailsModal = false; this.selectedRepairInvoice = null; }

  generateRepairInvoice(invoice: any): void {
    this.isRepairLoading = true;
    this.invoiceService.generateRepairInvoice(invoice.repairId).subscribe({
      next: (data: any) => {
        this.isRepairLoading = false;
        this.router.navigate(['/finance/invoice/create'], { queryParams: { invoiceId: data.invoice._id } });
      },
      error: (err: any) => {
        console.error(err); this.isRepairLoading = false;
        this.notificationService.show('Failed to generate repair invoice: ' + (err.error?.message || err.message), 'error');
      }
    });
  }
}