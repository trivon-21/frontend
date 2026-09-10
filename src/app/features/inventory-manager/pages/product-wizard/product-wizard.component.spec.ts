import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { InventoryItem } from '../../services/inventory-domain';
import { InventoryManagerDashboardService } from '../../services/inventory-manager-dashboard.service';
import { ConfirmService } from '../../../../services/confirm.service';
import { ProductWizardComponent } from './product-wizard.component';

function inventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    _id: '507f1f77bcf86cd799439011',
    name: 'Existing Compressor',
    description: 'Existing scroll compressor',
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
    location: 'A',
    binLocation: 'A101',
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
  confirmService: jasmine.SpyObj<ConfirmService>;
} {
  const item = inventoryItem();
  const service = jasmine.createSpyObj<InventoryManagerDashboardService>(
    'InventoryManagerDashboardService',
    ['getSuppliers', 'getLocations', 'getItem', 'updateItem', 'addItem'],
  );
  service.getSuppliers.and.returnValue(of([]));
  service.getLocations.and.returnValue(of([
    { warehouse: 'A', racks: [{ rackTag: 'R1', bins: ['A101', 'A102'] }, { rackTag: 'R2', bins: ['A201', 'A202'] }] },
    { warehouse: 'C', racks: [{ rackTag: 'R1', bins: ['C101', 'C102'] }] },
  ]));
  service.getItem.and.returnValue(of(item));
  service.updateItem.and.callFake((_itemId, update) => of({ ...item, ...update }));
  service.addItem.and.callFake((input) => of({ ...item, ...input }));

  const route = {
    snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
  } as ActivatedRoute;
  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const confirmService = jasmine.createSpyObj<ConfirmService>('ConfirmService', ['confirm']);
  const component = new ProductWizardComponent(new FormBuilder(), route, router, service, confirmService);
  component.ngOnInit();
  return { component, service, router, confirmService };
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
    component.form.controls['description'].setValue('High-performance scroll compressor');
    component.form.controls['unitCost'].setValue(250);
    component.form.controls['capacityBtu'].setValue(null);

    component.save();

    expect(service.updateItem).toHaveBeenCalledOnceWith(
      id,
      jasmine.objectContaining({
        name: 'Updated Compressor',
        description: 'High-performance scroll compressor',
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

  it('clears the rack and bin that do not belong to the selected warehouse', () => {
    const { component } = createComponent('507f1f77bcf86cd799439011');

    component.form.patchValue({ location: 'C', rackTag: 'R2', binLocation: 'A201' });
    component.onWarehouseChange();

    expect(component.form.controls['rackTag'].value).toBe('');
    expect(component.form.controls['binLocation'].value).toBe('');
    expect(component.form.hasError('storageLocation')).toBeTrue();
  });

  it('keeps only the bins of the selected rack and describes the full storage address', () => {
    const { component } = createComponent('507f1f77bcf86cd799439011');

    component.form.patchValue({ location: 'A', rackTag: 'R2', binLocation: 'A101' });
    component.onRackChange();

    expect(component.availableBins).toEqual(['A201', 'A202']);
    expect(component.form.controls['binLocation'].value).toBe('');

    component.form.patchValue({ binLocation: 'A201' });

    expect(component.storageLocationLabel).toBe('Warehouse A, R2, A201');
    expect(component.form.hasError('storageLocation')).toBeFalse();
  });

  it('marks the compatibility step complete only once compatibility data is entered', () => {
    const { component } = createComponent();
    component.goToStep(3);

    // Standing on the step must not mark it done - only entered data does.
    expect(component.isStepComplete(3)).toBeFalse();

    component.form.patchValue({ systemType: 'Split' });

    expect(component.isStepComplete(3)).toBeTrue();
  });

  describe('unsaved changes protection', () => {
    it('allows pristine navigation without confirmation prompt', () => {
      const { component, confirmService } = createComponent('507f1f77bcf86cd799439011');

      expect(component.canDeactivate()).toBeTrue();
      expect(confirmService.confirm).not.toHaveBeenCalled();
    });

    it('prompts user and aborts navigation when dirty and cancelled', async () => {
      const { component, confirmService } = createComponent('507f1f77bcf86cd799439011');
      component.form.controls['name'].setValue('Dirty Name Change');
      component.form.controls['name'].markAsDirty();
      confirmService.confirm.and.resolveTo(false);

      await expectAsync(component.canDeactivate()).toBeResolvedTo(false);
      expect(confirmService.confirm).toHaveBeenCalledOnceWith(jasmine.objectContaining({ variant: 'danger' }));
    });

    it('prompts user and permits navigation when dirty and discarded', async () => {
      const { component, confirmService } = createComponent('507f1f77bcf86cd799439011');
      component.form.controls['name'].setValue('Dirty Name Change');
      component.form.controls['name'].markAsDirty();
      confirmService.confirm.and.resolveTo(true);

      await expectAsync(component.canDeactivate()).toBeResolvedTo(true);
      expect(confirmService.confirm).toHaveBeenCalledOnceWith(jasmine.objectContaining({ variant: 'danger' }));
    });

    it('permits navigation without prompt after successful save', () => {
      const { component, confirmService } = createComponent('507f1f77bcf86cd799439011');
      component.savedItem = inventoryItem();

      expect(component.canDeactivate()).toBeTrue();
      expect(confirmService.confirm).not.toHaveBeenCalled();
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
