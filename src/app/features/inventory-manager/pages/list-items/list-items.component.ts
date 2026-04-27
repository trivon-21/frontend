import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface ListItem {
  id: string;
  sku: string;
  name: string;
  time?: string;
  status?: 'pending' | 'listed';
}

@Component({
  selector: 'app-list-items',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './list-items.component.html',
  styleUrls: ['./list-items.component.css']
})
export class ListItemsComponent {
  searchQuery: string = '';
  selectedType: string = 'Tools';
  selectedBrand: string = 'All Brands';
  selectedLocation: string = 'Location';

  pendingItems: ListItem[] = [
    { id: '1', sku: 'AC-COMP-001', name: '2 Ton Split AC Compressor' },
    { id: '2', sku: 'AC-COMP-001', name: '2 Ton Split AC Compressor' },
    { id: '3', sku: 'AC-COMP-001', name: '2 Ton Split AC Compressor' },
    { id: '4', sku: 'AC-COMP-001', name: '2 Ton Split AC Compressor' }
  ];

  listedItems: ListItem[] = [
    { id: '5', sku: 'REF-R410A-1KG', name: 'R410A Refrigerant (1kg)', time: '2 hours ago' },
    { id: '6', sku: 'REF-R410A-1KG', name: 'R410A Refrigerant (1kg)', time: '2 hours ago' },
    { id: '7', sku: 'REF-R410A-1KG', name: 'R410A Refrigerant (1kg)', time: '2 hours ago' },
    { id: '8', sku: 'REF-R410A-1KG', name: 'R410A Refrigerant (1kg)', time: '2 hours ago' },
    { id: '9', sku: 'REF-R410A-1KG', name: 'R410A Refrigerant (1kg)', time: '2 hours ago' },
    { id: '10', sku: 'REF-R410A-1KG', name: 'R410A Refrigerant (1kg)', time: '2 hours ago' }
  ];

  clearFilters() {
    this.searchQuery = '';
  }
}
