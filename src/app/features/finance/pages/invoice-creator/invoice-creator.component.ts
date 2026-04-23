import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-invoice-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-creator.component.html',
  styleUrls: ['./invoice-creator.component.css']
})
export class InvoiceCreatorComponent implements OnInit {

  currentPage  = 1;
  totalPages   = 3;
  invoiceId    = '';
  isLoading    = true;
  isConfirming = false;

  invoiceNumber   = '';
  invoiceDate     = '';
  customerName    = '';
  customerAddress = '';
  items:  any[]   = [];
  serviceCharge   = 0;

  get subTotal(): number {
    return this.items.reduce((s, i) => s + (i.amount || 0), 0);
  }

  get grandTotal(): number {
    return this.subTotal + this.serviceCharge;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['invoiceId']) {
        this.invoiceId = params['invoiceId'];
        this.loadInvoice(this.invoiceId);
      }
    });
  }

  loadInvoice(id: string): void {
    this.invoiceService.getInvoice(id).subscribe({
      next: (data: any) => {
        this.invoiceNumber   = data.invoiceNumber;
        this.invoiceDate     = new Date(data.invoiceDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
        this.customerName    = data.customerName;
        this.customerAddress = data.customerAddress;
        this.items           = data.items || [];
        this.serviceCharge   = data.serviceCharge || 0;
        this.isLoading       = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo(0, 0);
    }
  }

  confirmAndGenerate() {
    if (!this.invoiceId) return;
    this.isConfirming = true;
    this.invoiceService.confirmInvoice(this.invoiceId).subscribe({
      next: () => {
        this.isConfirming = false;
        alert('✅ Invoice confirmed! It has been moved to Pending Invoices.');
        this.router.navigate(['/invoice/pending']);
      },
      error: (err: any) => {
        this.isConfirming = false;
        alert('❌ Failed to confirm: ' + err.message);
      }
    });
  }
}