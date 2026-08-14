import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, BankDetails } from '../../../core/services/payment.service';

@Component({
  selector: 'app-bank-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-settings.html',
  styleUrl: './bank-settings.css'
})
export class BankSettings implements OnInit {
  private paymentService = inject(PaymentService);

  bankDetails: BankDetails = {
    bankName: '',
    accountNumber: '',
    accountName: '',
    branch: '',
    currency: 'LKR'
  };

  loading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.fetchBankDetails();
  }

  fetchBankDetails() {
    this.loading = true;
    this.paymentService.getBankDetails().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.bankDetails = { ...res.data };
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching bank details:', err);
        this.loading = false;
      }
    });
  }

  saveChanges() {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.paymentService.updateBankSettings(this.bankDetails).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Changes saved successfully!';
        this.loading = false;
        // Clear message after 3 seconds
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error saving bank details:', err);
        this.errorMessage = err.error?.message || 'Failed to save changes. Please check your permissions.';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }
}
