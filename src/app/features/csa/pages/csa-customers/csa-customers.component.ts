import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CsaCustomerService, CustomerProfile } from '../../services/csa-customer.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

const atLeastOneContactValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const phone = control.get('phoneNumber')?.value;
  const email = control.get('email')?.value;
  const hasPhone = phone && String(phone).trim().length > 0;
  const hasEmail = email && String(email).trim().length > 0;
  return (hasPhone || hasEmail) ? null : { requireContact: true };
};

@Component({
  selector: 'app-csa-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PortalIconsModule],
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
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]+$/)]],
      phoneNumber: ['', [Validators.pattern(/^0\d{9}$/)]],
      email: ['', [Validators.email]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      gender: [''],
      initialPassword: ['']
    }, {
      validators: [atLeastOneContactValidator]
    });
  }

  hasContactError(): boolean {
    const phoneCtrl = this.customerForm.get('phoneNumber');
    const emailCtrl = this.customerForm.get('email');
    const isTouched = !!(phoneCtrl?.touched || emailCtrl?.touched);
    const hasContact = !this.customerForm.errors?.['requireContact'];
    return isTouched && !hasContact;
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
        const fullName = `${res.customer?.fullName || ''} ${res.customer?.lastName || ''}`.trim();
        const toastMsg = res.emailSent
          ? `Customer profile created successfully! Login credentials have been emailed to ${res.customer?.email}.`
          : `Customer profile for "${fullName}" created successfully!`;
        this.showToast(toastMsg);
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
