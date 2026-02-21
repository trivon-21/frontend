import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  username: string = 'Customer';

  // Add cart items with quantity and price
  cartItems = [
    {
      name: 'AirLux Premium Split AC',
      capacity: '1.5 Ton (18,000 BTU)',
      price: 125000,
      quantity: 1,
      image: '/15-ton-3-star-lg-split-ac-20250203103524714 1.png'
    },
    {
      name: 'Elegance Pro 5000',
      capacity: '1 Ton (12,000 BTU)',
      price: 148000, // Set to 148,000 as requested
      quantity: 1,
      image: '/Image (Elegance Pro 5000).png'
    }
  ];

  ngOnInit() {
    this.username = localStorage.getItem('username') || 'Customer';
  }

  changeQty(idx: number, delta: number) {
    const newQty = this.cartItems[idx].quantity + delta;
    this.cartItems[idx].quantity = newQty < 1 ? 1 : newQty;
  }

  // Calculate subtotal
  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // Additional charges (fixed for now)
  additionalCharges: number = 2500;

  // Calculate total
  get total(): number {
    return this.subtotal + this.additionalCharges;
  }

  getItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
}
