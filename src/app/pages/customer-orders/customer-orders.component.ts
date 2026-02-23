import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="font-family:'Inter',sans-serif; padding: 8px 0;">
      <h2 style="font-size:22px;font-weight:700;color:#1b2f27;margin:0 0 8px;">My Orders</h2>
      <p style="color:#566463;font-size:14px;">Your order history will appear here.</p>
    </div>
  `
})
export class CustomerOrdersComponent {}
