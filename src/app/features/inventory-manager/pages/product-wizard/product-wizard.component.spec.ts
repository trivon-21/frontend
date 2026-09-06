import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { InventoryItem } from '../../services/inventory-domain';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { ProductWizardComponent } from './product-wizard.component';

function inventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    _id: '507f1f77bcf86cd799439011',
    name: 'Existing Compressor',
    sku: 'COMP-EDIT-1',
    available: 0,
    reserved: 0,
    reorderLevel: 5,
    maxStockLevel: 20,
    status: 'critical',
    type: 'Single',
    category: 'Spare Parts',
    itemClass: 'Spare Parts',
    subcategory: 'Compressor',
    brand: 'Copeland',
    location: 'Central Warehouse',
    binLocation: 'Small Parts Racking',
    unit: 'units',
    unitCost: 100,
    isSerialized: false,
    capacityBtu: 18000,
    ...overrides,
  };
}

function createComponent(id: string | null = null): {
  component: ProductWizardComponent;
  service: jasmine.SpyObj<InventoryManagerDashboardService>;
  router: jasmine.SpyObj<Router>;
} {
  const item = inventoryItem();
  const service = jasmine.createSpyObj<InventoryManagerDashboardService>(
    'InventoryManagerDashboardService',
    ['getSuppliers', 'getLocations', 'getItem', 'updateItem', 'addItem'],
  );
  service.getSuppliers.and.returnValue(of([]));
  service.getLocations.and.returnValue(of([
    { warehouse: 'Central Warehouse', placementAreas: ['Small Parts Racking', 'Consumables Storage'] },
    { warehouse: 'Service Warehouse', placementAreas: ['Tool Crib'] },
  ]));
  service.getItem.and.returnValue(of(item));
  service.updateItem.and.callFake((_itemId, update) => of({ ...item, ...update }));
  service.addItem.and.callFake((input) => of({ ...item, ...input }));

  const route = {
    snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
  } as ActivatedRoute;
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const component = new ProductWizardComponent(new FormBuilder(), route, router, service);
  component.ngOnInit();
  return { component, service, router };
}

describe('ProductWizardComponent', () => {
  it('allows all three sections to be opened in any order', () => {
    const { component } = createComponent();

    component.goToStep(3);
    expect(component.currentStep).toBe(3);

    component.goToStep(1);
    component.nextStep();
    expect(component.currentStep).toBe(2);

    component.goToStep(3);
    component.previousStep();
    expect(component.currentStep).toBe(2);
  });

  it('submits edits from any section and explicitly clears optional capacity', () => {
    const id = '507f1f77bcf86cd799439011';
    const { component, service, router } = createComponent(id);
    component.goToStep(2);
    component.form.controls['name'].setValue('Updated Compressor');
    component.form.controls['unitCost'].setValue(250);
    component.form.controls['capacityBtu'].setValue(null);

    component.save();

    expect(service.updateItem).toHaveBeenCalledOnceWith(
      id,
      jasmine.objectContaining({
        name: 'Updated Compressor',
        unitCost: 250,
        capacityBtu: null,
      }),
    );
    expect(router.navigate).toHaveBeenCalledOnceWith(
      ['/inventory-manager/inventory'],
      { queryParams: { selected: id, editSaved: '1' } },
    );
    expect(component.savedItem).toBeNull();
    expect(component.form.pristine).toBeTrue();
  });

  it('validates the whole form only when saving and opens the first invalid section', () => {
    const { component, service } = createComponent();
    component.goToStep(3);

    component.save();

    expect(service.addItem).not.toHaveBeenCalled();
    expect(component.currentStep).toBe(1);
    expect(component.form.controls['name'].touched).toBeTrue();
  });

  it('clears a placement area that does not belong to the selected warehouse', () => {
    const { component } = createComponent('507f1f77bcf86cd799439011');

    component.form.patchValue({ location: 'Service Warehouse', binLocation: 'Small Parts Racking' });
    component.onWarehouseChange();

    expect(component.form.controls['binLocation'].value).toBe('');
    expect(component.form.hasError('storageLocation')).toBeTrue();
  });

  describe('unsaved changes protection', () => {
    it('allows pristine navigation without confirmation prompt', () => {
      const { component } = createComponent('507f1f77bcf86cd799439011');
      spyOn(window, 'confirm');

      expect(component.canDeactivate()).toBeTrue();
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('prompts user and aborts navigation when dirty and cancelled', () => {
      const { component } = createComponent('507f1f77bcf86cd799439011');
      component.form.controls['name'].setValue('Dirty Name Change');
      component.form.controls['name'].markAsDirty();
      spyOn(window, 'confirm').and.returnValue(false);

      expect(component.canDeactivate()).toBeFalse();
      expect(window.confirm).toHaveBeenCalledOnceWith('Discard your unsaved product changes?');
    });

    it('prompts user and permits navigation when dirty and discarded', () => {
      const { component } = createComponent('507f1f77bcf86cd799439011');
      component.form.controls['name'].setValue('Dirty Name Change');
      component.form.controls['name'].markAsDirty();
      spyOn(window, 'confirm').and.returnValue(true);

      expect(component.canDeactivate()).toBeTrue();
      expect(window.confirm).toHaveBeenCalledOnceWith('Discard your unsaved product changes?');
    });

    it('permits navigation without prompt after successful save', () => {
      const { component } = createComponent('507f1f77bcf86cd799439011');
      component.savedItem = inventoryItem();
      spyOn(window, 'confirm');

      expect(component.canDeactivate()).toBeTrue();
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('prevents browser beforeunload when dirty and allows when clean or saved', () => {
      const { component } = createComponent('507f1f77bcf86cd799439011');
      const event = jasmine.createSpyObj<BeforeUnloadEvent>('BeforeUnloadEvent', ['preventDefault']);

      // Pristine
      component.beforeUnload(event);
      expect(event.preventDefault).not.toHaveBeenCalled();

      // Dirty
      component.form.controls['name'].setValue('Dirty Name Change');
      component.form.controls['name'].markAsDirty();
      component.beforeUnload(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);

      // Saved
      component.savedItem = inventoryItem();
      component.beforeUnload(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1); // not called again
    });
  });
});
