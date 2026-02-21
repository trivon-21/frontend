import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {
  username: string;
  activeTab: 'spec' | 'warranty' = 'spec';

  // Image gallery logic
  images = [
    '/15-ton-3-star-lg-split-ac-20250203103524714 1.png',
    '/image_2.jpg',
    '/image_3.jpg'
  ];
  selectedImageIdx = 0;

  // Quantity logic
  quantity = 1;

  // Custom capacity dropdown logic
  capacityOptions = [
    '1.5 Ton – LKR 125,000',
    '1 Ton – LKR 95,000',
    '2 Ton – LKR 165,000'
  ];
  selectedCapacity = this.capacityOptions[0];
  capacityDropdownOpen = false;

  // Add a mapping for capacity to price
  capacityPriceMap: { [key: string]: number } = {
    '1 Ton – LKR 95,000': 95000,
    '1.5 Ton – LKR 125,000': 125000,
    '2 Ton – LKR 165,000': 165000
  };

  get selectedPrice(): number {
    return this.capacityPriceMap[this.selectedCapacity] || 125000;
  }

  constructor() {
    // Try to fetch username from localStorage, fallback to 'Customer'
    this.username = localStorage.getItem('username') || 'Customer';
  }

  switchTab(tab: 'spec' | 'warranty') {
    this.activeTab = tab;
  }

  selectImage(idx: number) {
    this.selectedImageIdx = idx;
  }

  changeQty(delta: number) {
    const newQty = this.quantity + delta;
    this.quantity = newQty < 1 ? 1 : newQty;
  }

  openCapacityDropdown() {
    this.capacityDropdownOpen = true;
  }

  closeCapacityDropdown() {
    this.capacityDropdownOpen = false;
  }

  selectCapacity(option: string) {
    this.selectedCapacity = option;
    this.capacityDropdownOpen = false;
    // No need to do anything else, price is computed via getter
  }
}
