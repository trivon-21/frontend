import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { OrderItem } from '../../../../../services/order-creation.service';

@Component({
  selector: 'app-order-cart-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './order-cart-list.component.html',
  styleUrl: './order-cart-list.component.css',
  encapsulation: ViewEncapsulation.None
})
export class OrderCartListComponent {
  @Input() orderItems: OrderItem[] = [];
  @Output() itemUpdated = new EventEmitter<{index: number, newQty: number}>();
  @Output() itemRemoved = new EventEmitter<number>();

  selectedLineItemIndex: number | null = null;

  selectLineItem(index: number): void {
    this.selectedLineItemIndex = index;
  }

  removeLineItem(index: number, event: Event): void {
    event.stopPropagation();
    this.itemRemoved.emit(index);
    if (this.selectedLineItemIndex === index) {
      this.selectedLineItemIndex = null;
    }
  }

  updateItemQuantity(index: number, newQty: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.itemUpdated.emit({ index, newQty });
  }

  get orderTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + item.estimatedTotal, 0);
  }

  formatCurrency(val: number): string {
    return `LKR ${(val || 0).toLocaleString()}`;
  }
}
