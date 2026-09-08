import { fakeAsync, tick } from '@angular/core/testing';
import { OrderSupplierSelectorComponent } from './order-supplier-selector.component';
import { Supplier } from '../../../../../services/order-creation.service';

describe('OrderSupplierSelectorComponent', () => {
  let component: OrderSupplierSelectorComponent;
  const mockSuppliers: Supplier[] = [
    { _id: 'sup-1', name: 'Daikin Lanka' },
    { _id: 'sup-2', name: 'Carrier Air' },
    { _id: 'sup-3', name: 'Mitsubishi Electric' },
  ];

  beforeEach(() => {
    component = new OrderSupplierSelectorComponent();
    component.suppliers = [...mockSuppliers];
    component.filteredSuppliers = [...mockSuppliers];
    component.initialSupplier = '';
  });

  it('filters suppliers by search query without emitting supplierSelected', () => {
    spyOn(component.supplierSelected, 'emit');

    component.supplierSearchQuery = 'Dai';
    component.filterSuppliers();

    expect(component.filteredSuppliers.length).toBe(1);
    expect(component.filteredSuppliers[0].name).toBe('Daikin Lanka');
    expect(component.supplierSelected.emit).not.toHaveBeenCalled();
  });

  it('emits supplierSelected on explicit selectSupplier dropdown click', () => {
    spyOn(component.supplierSelected, 'emit');

    component.selectSupplier(mockSuppliers[0]);

    expect(component.supplierSearchQuery).toBe('Daikin Lanka');
    expect(component.supplierSelected.emit).toHaveBeenCalledWith('Daikin Lanka');
    expect(component.showSupplierDropdown).toBeFalse();
  });

  it('sets isAddingNewSupplier to true when selecting "new"', () => {
    spyOn(component.supplierSelected, 'emit');

    component.selectSupplier('new');

    expect(component.isAddingNewSupplier).toBeTrue();
    expect(component.showSupplierDropdown).toBeFalse();
    expect(component.supplierSelected.emit).not.toHaveBeenCalled();
  });

  it('emits newSupplierRequested when confirmNewSupplier is called with valid query', () => {
    spyOn(component.newSupplierRequested, 'emit');
    spyOn(component.supplierSelected, 'emit');

    component.isAddingNewSupplier = true;
    component.supplierSearchQuery = '  New Air Supplies  ';
    component.confirmNewSupplier();

    expect(component.newSupplierRequested.emit).toHaveBeenCalledWith('New Air Supplies');
    expect(component.supplierSelected.emit).not.toHaveBeenCalled();
    expect(component.isAddingNewSupplier).toBeFalse();
  });

  it('cancels adding new supplier and restores initialSupplier', () => {
    spyOn(component.supplierSelected, 'emit');
    component.initialSupplier = 'Daikin Lanka';
    component.supplierSearchQuery = 'Random typed text';
    component.isAddingNewSupplier = true;

    component.cancelNewSupplier();

    expect(component.isAddingNewSupplier).toBeFalse();
    expect(component.supplierSearchQuery).toBe('Daikin Lanka');
    expect(component.supplierSelected.emit).toHaveBeenCalledWith('Daikin Lanka');
  });

  it('emits exact match on blur when typed input matches an existing supplier', fakeAsync(() => {
    spyOn(component.supplierSelected, 'emit');
    component.supplierSearchQuery = 'carrier air';

    component.onSupplierInputBlur();
    tick(350);

    expect(component.supplierSearchQuery).toBe('Carrier Air');
    expect(component.supplierSelected.emit).toHaveBeenCalledWith('Carrier Air');
  }));

  it('reverts to initialSupplier on blur when typed input does not match any supplier', fakeAsync(() => {
    spyOn(component.supplierSelected, 'emit');
    component.initialSupplier = 'Daikin Lanka';
    component.supplierSearchQuery = 'Unknown Gibberish';

    component.onSupplierInputBlur();
    tick(350);

    expect(component.supplierSearchQuery).toBe('Daikin Lanka');
    expect(component.supplierSelected.emit).toHaveBeenCalledWith('Daikin Lanka');
  }));
});
