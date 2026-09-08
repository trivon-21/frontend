import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortalIconsModule } from '../../../../../../../shared/components/portal-icons/portal-icons.module';
import { Supplier } from '../../../../../services/order-creation.service';

@Component({
  selector: 'app-order-supplier-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './order-supplier-selector.component.html',
  styleUrl: './order-supplier-selector.component.css'
})
export class OrderSupplierSelectorComponent implements OnChanges {
  @Input() suppliers: Supplier[] = [];
  @Input() initialSupplier: string = '';
  @Output() supplierSelected = new EventEmitter<string>();
  @Output() newSupplierRequested = new EventEmitter<string>();
  @Output() registeringNewSupplier = new EventEmitter<boolean>();

  supplierSearchQuery = '';
  filteredSuppliers: Supplier[] = [];
  showSupplierDropdown = false;
  isAddingNewSupplier = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['suppliers']) {
      this.filteredSuppliers = this.suppliers;
    }
    if (changes['initialSupplier']) {
      this.supplierSearchQuery = this.initialSupplier || '';
    }
  }

  filterSuppliers(): void {
    const q = (this.supplierSearchQuery || '').toLowerCase().trim();
    if (!q) {
      this.filteredSuppliers = this.suppliers;
    } else {
      this.filteredSuppliers = this.suppliers.filter(s =>
        s.name.toLowerCase().includes(q)
      );
    }
    this.showSupplierDropdown = true;
  }

  onSupplierInputFocus(): void {
    this.showSupplierDropdown = true;
    this.filterSuppliers();
  }

  onSupplierInputBlur(): void {
    setTimeout(() => {
      this.showSupplierDropdown = false;
      if (this.isAddingNewSupplier) {
        return;
      }
      const q = (this.supplierSearchQuery || '').toLowerCase().trim();
      if (!q) {
        this.supplierSelected.emit('');
        return;
      }
      const exactMatch = this.suppliers.find(s => s.name.toLowerCase() === q);
      if (exactMatch) {
        this.supplierSearchQuery = exactMatch.name;
        this.supplierSelected.emit(exactMatch.name);
      } else {
        this.supplierSearchQuery = this.initialSupplier || '';
        this.supplierSelected.emit(this.supplierSearchQuery);
      }
    }, 300);
  }

  selectSupplier(supplier: Supplier | 'new'): void {
    if (supplier === 'new') {
      this.isAddingNewSupplier = true;
      this.showSupplierDropdown = false;
      this.registeringNewSupplier.emit(true);
      return;
    }
    this.supplierSearchQuery = supplier.name;
    this.isAddingNewSupplier = false;
    this.showSupplierDropdown = false;
    this.registeringNewSupplier.emit(false);
    this.supplierSelected.emit(supplier.name);
  }

  confirmNewSupplier(): void {
    const trimmed = (this.supplierSearchQuery || '').trim();
    if (!trimmed) return;
    this.isAddingNewSupplier = false;
    this.registeringNewSupplier.emit(false);
    this.newSupplierRequested.emit(trimmed);
  }

  cancelNewSupplier(): void {
    this.isAddingNewSupplier = false;
    this.registeringNewSupplier.emit(false);
    this.supplierSearchQuery = this.initialSupplier || '';
    this.supplierSelected.emit(this.supplierSearchQuery);
  }
}
