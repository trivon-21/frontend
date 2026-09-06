import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NewOrderFormComponent } from './new-order-form.component';
import { OrderCreationService } from '../../../services/order-creation.service';

describe('NewOrderFormComponent concurrency state', () => {
  it('keeps the returned statusVersion after every draft save', () => {
    const orderService = jasmine.createSpyObj<OrderCreationService>('OrderCreationService', [
      'submitOrderRequest',
    ]);
    orderService.submitOrderRequest.and.returnValue(of({
      _id: 'order-1',
      requestId: 'REQ-001',
      status: 'draft',
      statusVersion: 5,
      supplierName: 'Fabricated Supplier',
      requestedBy: 'Inventory Test User',
      priority: 'normal',
      totalEstimate: 10,
      items: [],
    }));
    const component = new NewOrderFormComponent(
      orderService,
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      { params: of({}) } as ActivatedRoute,
    );
    component.isEditMode = true;
    component.orderId = 'REQ-001';
    component.statusVersion = 4;
    component.suppliers = [{ _id: 'supplier-1', name: 'Fabricated Supplier' }];
    component.selectedSupplier = 'Fabricated Supplier';
    component.orderItems = [{
      inventoryId: 'inventory-1',
      name: 'Fabricated Item',
      sku: 'FAB-1',
      quantity: 1,
      unitCost: 10,
      estimatedTotal: 10,
      supplierId: 'supplier-1',
    }];

    component.saveDraft();

    expect(component.statusVersion).toBe(5);
    expect(orderService.submitOrderRequest).toHaveBeenCalledWith(
      jasmine.objectContaining({ statusVersion: 4 }),
      true,
      'REQ-001',
    );
  });

  describe('unsaved changes protection', () => {
    function setup(editMode = false) {
      const orderService = jasmine.createSpyObj<OrderCreationService>('OrderCreationService', [
        'getInventory',
        'getSuppliers',
        'getSuggestedItems',
        'getOrderRequests',
        'submitOrderRequest',
        'submitForManager',
      ]);
      orderService.getInventory.and.returnValue(of([]));
      orderService.getSuppliers.and.returnValue(of([{ _id: 'sup-1', name: 'Acme Corp' }]));
      orderService.getSuggestedItems.and.returnValue(of([]));
      orderService.getOrderRequests.and.returnValue(of([{
        _id: 'order-1',
        requestId: 'REQ-001',
        status: 'draft',
        statusVersion: 1,
        supplierName: 'Acme Corp',
        notes: 'Initial notes',
        items: [{
          inventoryId: 'inv-1',
          name: 'Item 1',
          sku: 'SKU-1',
          quantity: 2,
          unitCost: 50,
          estimatedTotal: 100,
        }],
      } as any]));
      orderService.submitOrderRequest.and.returnValue(of({
        _id: 'order-1',
        requestId: 'REQ-001',
        status: 'draft',
        statusVersion: 2,
        supplierName: 'Acme Corp',
        items: [],
      } as any));
      orderService.submitForManager.and.returnValue(of({
        requestId: 'REQ-001',
      } as any));

      const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
      const route = { params: of(editMode ? { id: 'REQ-001' } : {}) } as ActivatedRoute;
      const component = new NewOrderFormComponent(orderService, router, route);
      component.ngOnInit();
      return { component, orderService, router };
    }

    it('allows pristine navigation without prompt', () => {
      const { component } = setup();
      spyOn(window, 'confirm');

      expect(component.isDirty).toBeFalse();
      expect(component.canDeactivate()).toBeTrue();
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('prompts user and aborts navigation when dirty and cancelled', () => {
      const { component } = setup();
      component.orderNotes = 'New notes entered by user';
      spyOn(window, 'confirm').and.returnValue(false);

      expect(component.isDirty).toBeTrue();
      expect(component.canDeactivate()).toBeFalse();
      expect(window.confirm).toHaveBeenCalledOnceWith('Discard your unsaved order changes?');
    });

    it('prompts user and permits navigation when dirty and confirmed (discard)', () => {
      const { component } = setup();
      component.orderNotes = 'New notes entered by user';
      spyOn(window, 'confirm').and.returnValue(true);

      expect(component.isDirty).toBeTrue();
      expect(component.canDeactivate()).toBeTrue();
      expect(window.confirm).toHaveBeenCalledOnceWith('Discard your unsaved order changes?');
    });

    it('marks dirty when items are added or updated', () => {
      const { component } = setup();
      expect(component.isDirty).toBeFalse();

      component.onItemAdded({
        inventoryId: 'inv-1',
        name: 'Item 1',
        sku: 'SKU-1',
        quantity: 1,
        unitCost: 20,
        estimatedTotal: 20,
      });

      expect(component.isDirty).toBeTrue();
    });

    it('resets dirty state after saving draft so subsequent navigation is clean', () => {
      const { component } = setup();
      component.selectedSupplier = 'Acme Corp';
      component.suppliers = [{ _id: 'sup-1', name: 'Acme Corp' }];
      component.orderItems = [{
        inventoryId: 'inv-1',
        name: 'Item 1',
        sku: 'SKU-1',
        quantity: 1,
        unitCost: 20,
        estimatedTotal: 20,
      }];
      expect(component.isDirty).toBeTrue();

      spyOn(window, 'confirm');
      component.saveDraft();

      expect(component.isDirty).toBeFalse();
      expect(component.canDeactivate()).toBeTrue();
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('resets dirty state after submitting order so subsequent navigation is clean', () => {
      const { component } = setup();
      component.selectedSupplier = 'Acme Corp';
      component.suppliers = [{ _id: 'sup-1', name: 'Acme Corp' }];
      component.orderItems = [{
        inventoryId: 'inv-1',
        name: 'Item 1',
        sku: 'SKU-1',
        quantity: 1,
        unitCost: 20,
        estimatedTotal: 20,
      }];
      expect(component.isDirty).toBeTrue();

      spyOn(window, 'confirm');
      component.submitOrder();

      expect(component.isDirty).toBeFalse();
      expect(component.canDeactivate()).toBeTrue();
      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('prevents browser beforeunload when dirty and allows when pristine or saved', () => {
      const { component } = setup();
      const event = jasmine.createSpyObj<BeforeUnloadEvent>('BeforeUnloadEvent', ['preventDefault']);

      // Pristine
      component.beforeUnload(event);
      expect(event.preventDefault).not.toHaveBeenCalled();

      // Dirty
      component.orderNotes = 'Unsaved draft notes';
      component.beforeUnload(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);

      // Clean after save
      component.selectedSupplier = 'Acme Corp';
      component.suppliers = [{ _id: 'sup-1', name: 'Acme Corp' }];
      component.orderItems = [{
        inventoryId: 'inv-1',
        name: 'Item 1',
        sku: 'SKU-1',
        quantity: 1,
        unitCost: 20,
        estimatedTotal: 20,
      }];
      component.saveDraft();
      component.beforeUnload(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1); // not called again
    });
  });
});
