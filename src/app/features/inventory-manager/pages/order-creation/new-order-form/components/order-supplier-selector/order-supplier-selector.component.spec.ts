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

  describe('pinned-row 3-state toggle', () => {
    it('is unrestricted with the "Add New Supplier" label when nothing constrains the supplier', () => {
      expect(component.isRestricted).toBeFalse();
      expect(component.pinnedActionLabel).toBe('Add New Supplier');
      expect(component.sourceSuppliers).toEqual(mockSuppliers);
    });

    it('restricts to the relevant supplier(s) and labels the pinned row "Change Supplier"', () => {
      component.relevantSuppliers = [mockSuppliers[0]];

      expect(component.isRestricted).toBeTrue();
      expect(component.pinnedActionLabel).toBe('Change Supplier');
      expect(component.sourceSuppliers).toEqual([mockSuppliers[0]]);
    });

    it('filterSuppliers only searches the restricted set while restricted', () => {
      component.relevantSuppliers = [mockSuppliers[0]];
      component.supplierSearchQuery = 'Carrier';

      component.filterSuppliers();

      expect(component.filteredSuppliers).toEqual([]);
    });

    it('onPinnedAction expands a restricted dropdown to all suppliers, clears the query, and keeps the dropdown open', () => {
      component.relevantSuppliers = [mockSuppliers[0]];
      component.supplierSearchQuery = 'Daikin Lanka';
      spyOn(component.supplierSelected, 'emit');
      spyOn(component.registeringNewSupplier, 'emit');

      component.onPinnedAction();

      expect(component.isRestricted).toBeFalse();
      expect(component.supplierSearchQuery).toBe('');
      expect(component.filteredSuppliers).toEqual(mockSuppliers);
      expect(component.showSupplierDropdown).toBeTrue();
      expect(component.supplierSelected.emit).not.toHaveBeenCalled();
      expect(component.registeringNewSupplier.emit).not.toHaveBeenCalled();
    });

    it('onPinnedAction enters add-new mode and clears the query when unrestricted', () => {
      component.supplierSearchQuery = 'Half typed name';
      spyOn(component.registeringNewSupplier, 'emit');

      component.onPinnedAction();

      expect(component.isAddingNewSupplier).toBeTrue();
      expect(component.supplierSearchQuery).toBe('');
      expect(component.showSupplierDropdown).toBeFalse();
      expect(component.registeringNewSupplier.emit).toHaveBeenCalledWith(true);
    });

    it('a blur immediately after onPinnedAction (restricted -> all) is suppressed and does not close the dropdown or emit', fakeAsync(() => {
      component.relevantSuppliers = [mockSuppliers[0]];
      spyOn(component.supplierSelected, 'emit');

      component.onPinnedAction();
      component.onSupplierInputBlur();
      tick(350);

      expect(component.showSupplierDropdown).toBeTrue();
      expect(component.supplierSelected.emit).not.toHaveBeenCalled();
    }));

    it('resets to restricted mode when relevantSuppliers changes to a new set', () => {
      component.relevantSuppliers = [mockSuppliers[0]];
      component.onPinnedAction();
      expect(component.isRestricted).toBeFalse();

      component.relevantSuppliers = [mockSuppliers[1]];
      component.ngOnChanges({
        relevantSuppliers: {
          previousValue: [mockSuppliers[0]], currentValue: [mockSuppliers[1]],
          firstChange: false, isFirstChange: () => false,
        },
      });

      expect(component.isRestricted).toBeTrue();
      expect(component.sourceSuppliers).toEqual([mockSuppliers[1]]);
    });

    it('revertSignal change restores the query to initialSupplier and closes the dropdown', () => {
      component.initialSupplier = 'Daikin Lanka';
      component.supplierSearchQuery = 'Carrier Air';
      component.showSupplierDropdown = true;

      component.ngOnChanges({
        revertSignal: {
          previousValue: 0, currentValue: 1, firstChange: false, isFirstChange: () => false,
        },
      });

      expect(component.supplierSearchQuery).toBe('Daikin Lanka');
      expect(component.showSupplierDropdown).toBeFalse();
    });

    it('ignores the first revertSignal change on init', () => {
      component.initialSupplier = 'Daikin Lanka';
      component.supplierSearchQuery = 'Carrier Air';

      component.ngOnChanges({
        revertSignal: {
          previousValue: undefined, currentValue: 0, firstChange: true, isFirstChange: () => true,
        },
      });

      expect(component.supplierSearchQuery).toBe('Carrier Air');
    });
  });

  describe('clear selection', () => {
    it('hasSupplierSelection reflects whether a supplier is currently typed/confirmed', () => {
      expect(component.hasSupplierSelection).toBeFalse();

      component.supplierSearchQuery = 'Daikin Lanka';
      expect(component.hasSupplierSelection).toBeTrue();

      component.isAddingNewSupplier = true;
      expect(component.hasSupplierSelection).toBeFalse();
    });

    it('clearSupplier resets the query, closes the dropdown, and emits an empty selection', () => {
      component.supplierSearchQuery = 'Daikin Lanka';
      component.showSupplierDropdown = true;
      component.showAllSuppliers = true;
      spyOn(component.supplierSelected, 'emit');

      component.clearSupplier();

      expect(component.supplierSearchQuery).toBe('');
      expect(component.showSupplierDropdown).toBeFalse();
      expect(component.showAllSuppliers).toBeFalse();
      expect(component.supplierSelected.emit).toHaveBeenCalledWith('');
    });

    it('a blur immediately after clearSupplier is suppressed and does not revert or re-emit', fakeAsync(() => {
      component.initialSupplier = 'Daikin Lanka';
      component.supplierSearchQuery = 'Daikin Lanka';
      spyOn(component.supplierSelected, 'emit');

      component.clearSupplier();
      component.onSupplierInputBlur();
      tick(350);

      expect(component.supplierSearchQuery).toBe('');
      expect(component.supplierSelected.emit).toHaveBeenCalledOnceWith('');
    }));
  });
});
