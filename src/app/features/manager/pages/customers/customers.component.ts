import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomersService, Customer } from '../../services/customers.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css'],
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  total = 0;
  status = 'Syncing…';
  loading = false;
  search = '';
  selected: Customer | null = null;

  private search$ = new Subject<string>();

  constructor(private customersService: CustomersService) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.load());
    this.load();
  }

  onSearchChange(): void {
    this.search$.next(this.search);
  }

  load(): void {
    this.loading = true;
    this.customersService.getCustomers(this.search.trim()).subscribe({
      next: (res) => {
        this.customers = res.customers;
        this.total = res.total;
        this.status = res.status;
        this.loading = false;
        // Keep selection valid.
        if (this.selected && !this.customers.find((c) => c._id === this.selected!._id)) {
          this.selected = null;
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  select(customer: Customer): void {
    this.selected = this.selected?._id === customer._id ? null : customer;
  }

  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : (parts[0]?.[0] || '?').toUpperCase();
  }

  joined(date?: Date | string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
