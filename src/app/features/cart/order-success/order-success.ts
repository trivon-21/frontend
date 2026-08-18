import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.html',
  styleUrl: './order-success.css'
})
export class OrderSuccess implements OnInit {
  orderId: string = '';
  username: string = '';
  isBuyAndInstall: boolean = false;
  public router = inject(Router);

  ngOnInit() {
    this.username = localStorage.getItem('username') || 'Customer';
    const state = history.state;
    if (state) {
      if (state.orderId) this.orderId = state.orderId;
      if (state.isBuyAndInstall) this.isBuyAndInstall = state.isBuyAndInstall;
    }
  }

  goToCatalog() {
    this.router.navigate(['/catalog']);
  }
}
