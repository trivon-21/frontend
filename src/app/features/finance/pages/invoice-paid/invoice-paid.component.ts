import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-paid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-paid.component.html',
  styleUrls: ['./invoice-paid.component.css']
})
export class InvoicePaidComponent implements OnInit {

  activeTab: 'installation' | 'repair' = 'installation';

  searchQuery = ''; selectedDate = ''; currentPage = 1; itemsPerPage = 8; totalItems = 0;
  invoices: any[] = []; filteredInvoices: any[] = [];
  selectedInvoice: any = null; showModal = false; isLoading = false;

  repairSearchQuery = ''; repairSelectedDate = ''; repairCurrentPage = 1; repairTotalItems = 0;
  repairInvoices: any[] = []; filteredRepairInvoices: any[] = [];
  selectedRepairInvoice: any = null; showRepairModal = false; isRepairLoading = false;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void { this.loadInvoices(); this.loadRepairInvoices(); }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getPaidInvoices().subscribe({
      next: (data) => { this.invoices = data; this.applyFilters(); this.isLoading = false; },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.filteredInvoices = this.invoices.filter(i => {
      const s = this.searchQuery.toLowerCase();
      const ms = this.searchQuery ? i.invoiceNumber?.toLowerCase().includes(s) || i.customerName?.toLowerCase().includes(s) : true;
      const md = this.selectedDate ? new Date(i.paidAt || i.updatedAt).toDateString() === new Date(this.selectedDate).toDateString() : true;
      return ms && md;
    });
    this.totalItems = this.filteredInvoices.length; this.currentPage = 1;
  }

  get paginatedInvoices() { const s=(this.currentPage-1)*this.itemsPerPage; return this.filteredInvoices.slice(s,s+this.itemsPerPage); }
  get totalPages(): number[] { return Array.from({ length: Math.ceil(this.totalItems/this.itemsPerPage) }, (_,i) => i+1); }
  get startItem() { return this.totalItems===0?0:(this.currentPage-1)*this.itemsPerPage+1; }
  get endItem()   { return Math.min(this.currentPage*this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage*this.itemsPerPage<this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage>1) this.currentPage--; }
  goToPage(p: number) { this.currentPage = p; }
  viewInvoice(i: any) { this.selectedInvoice = i; this.showModal = true; }
  closeModal()        { this.selectedInvoice = null; this.showModal = false; }

  loadRepairInvoices(): void {
    this.isRepairLoading = true;
    this.invoiceService.getRepairPaidInvoices().subscribe({
      next: (data) => { this.repairInvoices = data; this.applyRepairFilters(); this.isRepairLoading = false; },
      error: (err) => { console.error(err); this.isRepairLoading = false; }
    });
  }

  applyRepairFilters(): void {
    this.filteredRepairInvoices = this.repairInvoices.filter(i => {
      const s = this.repairSearchQuery.toLowerCase();
      const ms = this.repairSearchQuery ? i.invoiceNumber?.toLowerCase().includes(s) || i.customerName?.toLowerCase().includes(s) : true;
      const md = this.repairSelectedDate ? new Date(i.paidAt || i.updatedAt).toDateString() === new Date(this.repairSelectedDate).toDateString() : true;
      return ms && md;
    });
    this.repairTotalItems = this.filteredRepairInvoices.length; this.repairCurrentPage = 1;
  }

  get paginatedRepairInvoices() { const s=(this.repairCurrentPage-1)*this.itemsPerPage; return this.filteredRepairInvoices.slice(s,s+this.itemsPerPage); }
  get repairTotalPages(): number[] { return Array.from({ length: Math.ceil(this.repairTotalItems/this.itemsPerPage) }, (_,i) => i+1); }
  get repairStartItem() { return this.repairTotalItems===0?0:(this.repairCurrentPage-1)*this.itemsPerPage+1; }
  get repairEndItem()   { return Math.min(this.repairCurrentPage*this.itemsPerPage, this.repairTotalItems); }
  repairNextPage() { if (this.repairCurrentPage*this.itemsPerPage<this.repairTotalItems) this.repairCurrentPage++; }
  repairPrevPage() { if (this.repairCurrentPage>1) this.repairCurrentPage--; }
  repairGoToPage(p: number) { this.repairCurrentPage = p; }
  viewRepairInvoice(i: any) { this.selectedRepairInvoice = i; this.showRepairModal = true; }
  closeRepairModal()        { this.selectedRepairInvoice = null; this.showRepairModal = false; }

  shortId(id: any): string {
    return id ? id.toString().slice(-6).toUpperCase() : '—';
  }
}