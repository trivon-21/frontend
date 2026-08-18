import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-invoice-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-creator.component.html',
  styleUrls: ['./invoice-creator.component.css']
})
export class InvoiceCreatorComponent implements OnInit {

  invoiceId    = '';
  isLoading    = true;
  isConfirming = false;
  invoiceType  = 'INSTALLATION'; // INSTALLATION or REPAIR

  invoiceNumber   = '';
  invoiceDate     = '';
  customerName    = '';
  customerAddress = '';
  items: any[]    = [];

  get subTotal(): number {
    return this.items.reduce((s, i) => s + (i.amount || 0), 0);
  }

  get grandTotal(): number {
    return this.subTotal;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private notificationService: NotificationService
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
        this.invoiceNumber  = data.invoiceNumber || '';
        this.invoiceType    = data.invoiceType   || 'INSTALLATION';
        this.customerName   = data.customerName  || '';
        this.customerAddress= data.customerAddress || '';
        this.items          = data.items         || [];

        // Safe date parsing — invoiceDate or createdAt
        const rawDate = data.invoiceDate || data.createdAt;
        if (rawDate) {
          const d = new Date(rawDate);
          this.invoiceDate = isNaN(d.getTime())
            ? ''
            : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } else {
          this.invoiceDate = '';
        }

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Label for the heading — shows repair type if applicable
  get invoiceTypeLabel(): string {
    return this.invoiceType === 'REPAIR' ? 'Repair Invoice' : 'Installation Invoice';
  }

  confirmAndGenerate(): void {
    if (!this.invoiceId) return;
    this.isConfirming = true;
    this.invoiceService.confirmInvoice(this.invoiceId).subscribe({
      next: () => {
        this.isConfirming = false;
        this.notificationService.show('✅ Invoice confirmed! It has been moved to Pending Invoices.', 'success');
        this.router.navigate(['/finance/invoice/pending']);
      },
      error: (err: any) => {
        this.isConfirming = false;
        this.notificationService.show('❌ Failed to confirm: ' + (err.error?.message || err.message), 'error');
      }
    });
  }
}