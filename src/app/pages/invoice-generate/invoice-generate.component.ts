import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-generate.component.html',
  styleUrls: ['./invoice-generate.component.css']
})
export class InvoiceGenerateComponent implements OnInit {

  invoices:      any[] = [];
  searchQuery    = '';
  selectedInvoice: any = null;
  showDetailsModal = false;
  isLoading      = false;

  constructor(
    private invoiceService: InvoiceService,
    private router: Router
  ) {}

  ngOnInit(): void { this.loadQueue(); }

  loadQueue(): void {
    this.isLoading = true;
    this.invoiceService.getInvoiceQueue().subscribe({
      next: (data: any[]) => { this.invoices = data; this.isLoading = false; },
      error: (err: any)   => { console.error(err); this.isLoading = false; }
    });
  }

  get filteredInvoices() {
    if (!this.searchQuery.trim()) return this.invoices;
    const q = this.searchQuery.toLowerCase();
    return this.invoices.filter(i =>
      i.orderRef?.toLowerCase().includes(q) ||
      i.invoiceId?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q)
    );
  }

  openDetails(invoice: any) {
    this.selectedInvoice = invoice;
    this.showDetailsModal = true;
  }

  closeModal() { this.showDetailsModal = false; this.selectedInvoice = null; }

  generateInvoice(invoice: any): void {
    this.isLoading = true;
    this.invoiceService.generateInvoice(invoice.reportId).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        this.router.navigate(['/invoice/create'], {
          queryParams: { invoiceId: data.invoice._id }
        });
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        alert('❌ Failed to generate invoice: ' + err.message);
      }
    });
  }
}