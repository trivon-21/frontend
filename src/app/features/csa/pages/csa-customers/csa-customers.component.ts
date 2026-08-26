import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CsaCustomerService, CustomerProfile } from '../../services/csa-customer.service';

@Component({
  selector: 'app-csa-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './csa-customers.component.html',
  styleUrl: './csa-customers.component.css'
})
export class CsaCustomersComponent implements OnInit {
  customers: CustomerProfile[] = [];
  totalCustomers = 0;
  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  successToast = '';

  // Modals
  showCreateModal = false;
  showDetailsModal = false;
  selectedCustomerDetails: any = null;
  isLoadingDetails = false;

  // Create Form
  customerForm: FormGroup;
  isSubmitting = false;
  formError = '';

  constructor(
    private customerService: CsaCustomerService,
    private fb: FormBuilder
  ) {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      lastName: ['', [Validators.pattern(/^[a-zA-Z\s]*$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
      email: ['', [Validators.email]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      gender: [''],
      initialPassword: ['']
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.customerService.getCustomers(this.searchQuery).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.customers = res.customers || [];
          this.totalCustomers = res.total || this.customers.length;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load customers:', err);
        this.errorMessage = 'Failed to load customer records. Please try again.';
      }
    });
  }

  onSearchChange(): void {
    this.loadCustomers();
  }

  openCreateModal(): void {
    this.customerForm.reset({ gender: '' });
    this.formError = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.formError = '';

    const formVal = this.customerForm.value;
    this.customerService.createCustomer(formVal).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.showCreateModal = false;
        this.showToast(`Customer "${res.customer?.fullName}" created successfully!`);
        this.loadCustomers();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Failed to create customer:', err);
        this.formError = err.error?.message || err.message || 'Failed to create customer profile.';
      }
    });
  }

  viewDetails(customer: CustomerProfile): void {
    this.selectedCustomerDetails = null;
    this.showDetailsModal = true;
    this.isLoadingDetails = true;

    this.customerService.getCustomerById(customer._id).subscribe({
      next: (res) => {
        this.isLoadingDetails = false;
        if (res && res.success) {
          this.selectedCustomerDetails = res.data;
        }
      },
      error: (err) => {
        this.isLoadingDetails = false;
        console.error('Failed to get customer details:', err);
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCustomerDetails = null;
  }

  showToast(msg: string): void {
    this.successToast = msg;
    setTimeout(() => {
      if (this.successToast === msg) {
        this.successToast = '';
      }
    }, 4000);
  }

  formatDate(dateStr: string | undefined): string {
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

  getInitials(name: string): string {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
}
