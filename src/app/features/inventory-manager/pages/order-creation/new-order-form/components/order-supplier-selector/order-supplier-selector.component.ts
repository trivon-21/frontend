import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalIconComponent } from '../../../../../../../shared/components/local-icon/local-icon.component';
import { Supplier } from '../../../../../services/order-creation.service';

@Component({
  selector: 'app-order-supplier-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LocalIconComponent],
  templateUrl: './order-supplier-selector.component.html',
  styleUrl: './order-supplier-selector.component.css'
})
export class OrderSupplierSelectorComponent implements OnChanges {
  @Input() suppliers: Supplier[] = [];
  @Input() initialSupplier: string = '';
  @Output() supplierSelected = new EventEmitter<string>();

  supplierSearchQuery = '';
  filteredSuppliers: Supplier[] = [];
  showSupplierDropdown = false;
  isAddingNewSupplier = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['suppliers']) {
      this.filteredSuppliers = this.suppliers;
    }
    if (changes['initialSupplier'] && this.initialSupplier) {
      this.supplierSearchQuery = this.initialSupplier;
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

    const exactMatch = this.suppliers.find(s => s.name.toLowerCase() === q);
    if (exactMatch) {
      this.supplierSelected.emit(exactMatch.name);
    } else if (!this.isAddingNewSupplier) {
      this.supplierSelected.emit('');
    }
    this.showSupplierDropdown = true;
  }

  onSupplierInputFocus(): void {
    this.showSupplierDropdown = true;
    this.filterSuppliers();
  }

  onSupplierInputBlur(): void {
    setTimeout(() => { this.showSupplierDropdown = false; }, 300);
  }

  selectSupplier(supplier: Supplier | 'new'): void {
    if (supplier === 'new') {
      this.isAddingNewSupplier = true;
      this.showSupplierDropdown = false;
      return;
    }
    this.supplierSearchQuery = supplier.name;
    this.isAddingNewSupplier = false;
    this.showSupplierDropdown = false;
    this.supplierSelected.emit(supplier.name);
  }

  confirmNewSupplier(): void {
    if (!this.supplierSearchQuery.trim()) return;
    this.isAddingNewSupplier = false;
    this.supplierSelected.emit(this.supplierSearchQuery.trim());
  }

  cancelNewSupplier(): void {
    this.isAddingNewSupplier = false;
    this.supplierSearchQuery = this.initialSupplier || '';
    this.supplierSelected.emit(this.supplierSearchQuery);
  }
}
