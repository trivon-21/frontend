import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Order {
  name: string;
  date: string;
  price: string;
  status: 'Completed' | 'Pending' | 'Returned';
}

@Component({
  selector: 'app-customer-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-dashboard-home.component.html',
  styleUrl: './customer-dashboard-home.component.css',
})
export class CustomerDashboardHomeComponent {
  orders: Order[] = [
    { name: 'John Doe',     date: 'Sat, 20 Apr 2020', price: '$80.09', status: 'Completed' },
    { name: 'Mc Dillan',    date: 'Fri, 19 Apr 2020',  price: '$7.03',  status: 'Pending'   },
    { name: 'Dasun Perera', date: 'Tue, 19 Apr 2020', price: '$30.09', status: 'Returned'  },
    { name: 'Ameesha',      date: 'Sat, 20 Apr 2020', price: '$80.09', status: 'Completed' },
    { name: 'Nisal',        date: 'Tue, 19 Apr 2020', price: '$30.09', status: 'Returned'  },
  ];
}
