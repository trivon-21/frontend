import { Component, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
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
  @Input() relevantSuppliers: Supplier[] = [];
  @Input() initialSupplier: string = '';
  @Input() revertSignal = 0;
  @Output() supplierSelected = new EventEmitter<string>();
  @Output() newSupplierRequested = new EventEmitter<string>();
  @Output() registeringNewSupplier = new EventEmitter<boolean>();

  @ViewChild('supplierInput') supplierInputRef?: ElementRef<HTMLInputElement>;

  supplierSearchQuery = '';
  filteredSuppliers: Supplier[] = [];
  showSupplierDropdown = false;
  isAddingNewSupplier = false;
  showAllSuppliers = false;
  private suppressNextBlur = false;

  get isRestricted(): boolean {
    return this.relevantSuppliers.length > 0 && !this.showAllSuppliers;
  }

  get sourceSuppliers(): Supplier[] {
    return this.isRestricted ? this.relevantSuppliers : this.suppliers;
  }

  get pinnedActionLabel(): string {
    return this.isRestricted ? 'Change Supplier' : 'Add New Supplier';
  }

  get hasSupplierSelection(): boolean {
    return !!this.supplierSearchQuery.trim() && !this.isAddingNewSupplier;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['suppliers'] || changes['relevantSuppliers']) {
      if (changes['relevantSuppliers']) {
        this.showAllSuppliers = false;
      }
      this.filteredSuppliers = this.sourceSuppliers;
    }
    if (changes['initialSupplier']) {
      this.supplierSearchQuery = this.initialSupplier || '';
    }
    if (changes['revertSignal'] && !changes['revertSignal'].firstChange) {
      this.showSupplierDropdown = false;
      this.showAllSuppliers = false;
      this.supplierSearchQuery = this.initialSupplier || '';
    }
  }

  filterSuppliers(): void {
    const q = (this.supplierSearchQuery || '').toLowerCase().trim();
    if (!q) {
      this.filteredSuppliers = this.sourceSuppliers;
    } else {
      this.filteredSuppliers = this.sourceSuppliers.filter(s =>
        s.name.toLowerCase().includes(q)
      );
    }
    if (!this.isAddingNewSupplier) {
      this.showSupplierDropdown = true;
    }
  }

  onSupplierInputFocus(): void {
    if (this.isAddingNewSupplier) {
      return;
    }
    this.showSupplierDropdown = true;
    this.filterSuppliers();
  }

  onSupplierInputBlur(): void {
    setTimeout(() => {
      if (this.suppressNextBlur) {
        this.suppressNextBlur = false;
        return;
      }
      this.showSupplierDropdown = false;
      if (this.isAddingNewSupplier) {
        return;
      }
      const q = (this.supplierSearchQuery || '').toLowerCase().trim();
      if (!q) {
        if (this.showAllSuppliers) {
          this.showAllSuppliers = false;
          this.supplierSearchQuery = this.initialSupplier || '';
          this.supplierSelected.emit(this.supplierSearchQuery);
          return;
        }
        this.supplierSelected.emit('');
        return;
      }
      const exactMatch = this.sourceSuppliers.find(s => s.name.toLowerCase() === q);
      if (exactMatch) {
        this.supplierSearchQuery = exactMatch.name;
        this.showAllSuppliers = false;
        this.supplierSelected.emit(exactMatch.name);
      } else {
        this.supplierSearchQuery = this.initialSupplier || '';
        this.supplierSelected.emit(this.supplierSearchQuery);
      }
    }, 300);
  }

  onPinnedAction(): void {
    if (this.isRestricted) {
      this.showAllSuppliers = true;
      this.supplierSearchQuery = '';
      this.suppressNextBlur = true;
      this.filterSuppliers();
      setTimeout(() => this.supplierInputRef?.nativeElement.focus());
      return;
    }
    this.isAddingNewSupplier = true;
    this.showSupplierDropdown = false;
    this.supplierSearchQuery = '';
    this.registeringNewSupplier.emit(true);
  }

  clearSupplier(): void {
    this.supplierSearchQuery = '';
    this.showSupplierDropdown = false;
    this.showAllSuppliers = false;
    this.suppressNextBlur = true;
    this.supplierSelected.emit('');
  }

  selectSupplier(supplier: Supplier): void {
    this.supplierSearchQuery = supplier.name;
    this.isAddingNewSupplier = false;
    this.showSupplierDropdown = false;
    this.showAllSuppliers = false;
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
    this.showAllSuppliers = false;
    this.registeringNewSupplier.emit(false);
    this.supplierSearchQuery = this.initialSupplier || '';
    this.supplierSelected.emit(this.supplierSearchQuery);
  }
}
