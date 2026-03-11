import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  loading = true;
  error: string | null = null;

  // Filter properties
  searchTerm = '';
  selectedStatus = 'All';
  purchasedDate = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.loading = true;
    this.http.get<any[]>('http://localhost:3000/api/orders')
      .subscribe({
        next: (data) => {
          this.orders = data;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load orders: ' + err.message;
          this.loading = false;
        }
      });
  }

  applyFilters() {
    let filtered = this.orders;

    // Filter by search term (customer name, order ID, item or amount)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const matchesName = order.customerName?.toLowerCase().includes(term);
        const matchesId = order._id?.toLowerCase().includes(term);
        const matchesItem = order.itemName?.toLowerCase().includes(term);
        const matchesAmount = order.amount != null && order.amount.toString().includes(term);
        return matchesName || matchesId || matchesItem || matchesAmount;
      });
    }


    // Filter by status
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Filter by purchased date
    if (this.purchasedDate) {
      const selectedDate = new Date(this.purchasedDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === selectedDate.toDateString();
      });
    }

    this.filteredOrders = filtered;
  }

  onFilterChange() {
    this.applyFilters();
  }

  formatDate(date: string | Date): { day: string; date: string } {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[d.getDay()];
    const dayNum = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return {
      day: `${dayName}, ${dayNum}`,
      date: `${month} ${year}`
    };
  }

  viewOrder(order: any) {
    console.log('View order:', order);
    // Add navigation or modal logic here
  }
}