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

  describe('order submission and validation enhancements', () => {
    function setupWithMocks(queryParams: Record<string, string> = {}) {
      const orderService = jasmine.createSpyObj<OrderCreationService>('OrderCreationService', [
        'getInventory',
        'getSuppliers',
        'getSuggestedItems',
        'getOrderRequests',
        'submitOrderRequest',
        'submitForManager',
        'addSupplier',
      ]);
      orderService.getInventory.and.returnValue(of([
        {
          _id: 'inv-item-1',
          id: 'inv-item-1',
          name: 'Cooling Coil',
          sku: 'CC-01',
          available: 5,
          reserved: 0,
          reorderLevel: 2,
          maxStockLevel: 20,
          status: 'normal',
          type: 'Single',
          category: 'Parts',
          brand: 'Daikin',
          unit: 'units',
          unitCost: 1500,
          isSerialized: false,
          supplierId: 'sup-1',
          supplierName: 'Daikin Lanka',
        } as any,
      ]));
      orderService.getSuppliers.and.returnValue(of([
        { _id: 'sup-1', name: 'Daikin Lanka' },
        { _id: 'sup-2', name: 'Carrier Air' },
      ]));
      orderService.getSuggestedItems.and.returnValue(of([]));
      orderService.submitOrderRequest.and.returnValue(of({
        _id: 'order-1',
        requestId: 'REQ-101',
        status: 'draft',
        statusVersion: 1,
        supplierName: 'Daikin Lanka',
        items: [],
      } as any));
      orderService.submitForManager.and.returnValue(of({
        requestId: 'REQ-101',
      } as any));

      const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
      const route = {
        params: of({}),
        snapshot: { queryParams },
      } as unknown as ActivatedRoute;
      const component = new NewOrderFormComponent(orderService, router, route);
      return { component, orderService, router };
    }

    it('shows error when attempting to submit with no supplier', () => {
      const { component, orderService } = setupWithMocks();
      component.ngOnInit();
      component.selectedSupplier = '';
      component.orderItems = [{
        inventoryId: 'inv-item-1',
        name: 'Cooling Coil',
        sku: 'CC-01',
        quantity: 1,
        unitCost: 1500,
        estimatedTotal: 1500,
      }];

      component.submitOrder();

      expect(component.errorMessage).toBe('Please select a supplier before submitting.');
      expect(orderService.submitOrderRequest).not.toHaveBeenCalled();
    });

    it('shows error when attempting to submit with no order items', () => {
      const { component, orderService } = setupWithMocks();
      component.ngOnInit();
      component.selectedSupplier = 'Daikin Lanka';
      component.orderItems = [];

      component.submitOrder();

      expect(component.errorMessage).toBe('Please add at least one inventory item before submitting.');
      expect(orderService.submitOrderRequest).not.toHaveBeenCalled();
    });

    it('auto-commits staged item from item search ref on submitOrder', () => {
      const { component, orderService, router } = setupWithMocks();
      component.ngOnInit();
      component.selectedSupplier = 'Daikin Lanka';
      component.orderItems = [];

      // Mock itemSearchRef with a selectedItem
      const mockItemSearch = {
        selectedItem: {
          _id: 'inv-item-1',
          name: 'Cooling Coil',
          sku: 'CC-01',
          unitCost: 1500,
        },
        addLineItem: jasmine.createSpy('addLineItem').and.callFake(() => {
          component.onItemAdded({
            inventoryId: 'inv-item-1',
            name: 'Cooling Coil',
            sku: 'CC-01',
            quantity: 2,
            unitCost: 1500,
            estimatedTotal: 3000,
            supplierId: 'sup-1',
          });
        }),
      } as any;
      component.itemSearchRef = mockItemSearch;

      component.submitOrder();

      expect(mockItemSearch.addLineItem).toHaveBeenCalled();
      expect(component.orderItems.length).toBe(1);
      expect(orderService.submitOrderRequest).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/inventory-manager/order-creation'],
        jasmine.objectContaining({ queryParams: { success: 'Order REQ-101 submitted successfully!' } })
      );
    });

    it('auto-commits staged item on saveDraft', () => {
      const { component, orderService } = setupWithMocks();
      component.ngOnInit();
      component.selectedSupplier = 'Daikin Lanka';
      component.orderItems = [];

      const mockItemSearch = {
        selectedItem: { _id: 'inv-item-1' },
        addLineItem: jasmine.createSpy('addLineItem').and.callFake(() => {
          component.onItemAdded({
            inventoryId: 'inv-item-1',
            name: 'Cooling Coil',
            sku: 'CC-01',
            quantity: 1,
            unitCost: 1500,
            estimatedTotal: 1500,
            supplierId: 'sup-1',
          });
        }),
      } as any;
      component.itemSearchRef = mockItemSearch;

      component.saveDraft();

      expect(mockItemSearch.addLineItem).toHaveBeenCalled();
      expect(component.orderItems.length).toBe(1);
      expect(orderService.submitOrderRequest).toHaveBeenCalled();
    });

    it('does not trigger addSupplier HTTP when onSupplierSelected is called with unrecognized string', () => {
      const { component, orderService } = setupWithMocks();
      component.ngOnInit();

      component.onSupplierSelected('NonExistentSupplier');

      expect(component.selectedSupplier).toBe('');
      expect(orderService.addSupplier).not.toHaveBeenCalled();
    });

    it('calls addSupplier HTTP only through explicit onAddNewSupplier', () => {
      const { component, orderService } = setupWithMocks();
      component.ngOnInit();
      orderService.addSupplier.and.returnValue(of({
        _id: 'sup-new',
        name: 'Brand New Supplier',
      }));

      component.onAddNewSupplier('Brand New Supplier');

      expect(orderService.addSupplier).toHaveBeenCalledWith('Brand New Supplier');
      expect(component.selectedSupplier).toBe('Brand New Supplier');
      expect(component.suppliers.some(s => s.name === 'Brand New Supplier')).toBeTrue();
    });

    it('pre-populates order item when itemId is present in queryParams', () => {
      const { component } = setupWithMocks({ itemId: 'inv-item-1' });
      component.ngOnInit();

      expect(component.orderItems.length).toBe(1);
      expect(component.orderItems[0].name).toBe('Cooling Coil');
      expect(component.selectedSupplier).toBe('Daikin Lanka');
    });

    it('normalizes line item supplierId against order supplier in buildPayload', () => {
      const { component, orderService } = setupWithMocks();
      component.ngOnInit();
      component.selectedSupplier = 'Daikin Lanka';
      component.orderItems = [{
        inventoryId: 'inv-item-1',
        name: 'Cooling Coil',
        sku: 'CC-01',
        quantity: 1,
        unitCost: 1500,
        estimatedTotal: 1500,
        supplierId: '', // unassigned on line
      }];

      component.submitOrder();

      expect(orderService.submitOrderRequest).toHaveBeenCalledWith(
        jasmine.objectContaining({
          supplierId: 'sup-1',
          supplierName: 'Daikin Lanka',
          items: [
            jasmine.objectContaining({
              supplierId: 'sup-1', // resolved from selected supplier
            }),
          ],
        }),
        false,
        null as any,
      );
    });

    it('automatically updates selectedSupplier when an item with a registered supplier is selected', () => {
      const { component } = setupWithMocks();
      component.ngOnInit();
      component.selectedSupplier = '';

      const mockItem: any = {
        _id: 'inv-item-1',
        name: 'Cooling Coil',
        sku: 'CC-01',
        supplierId: 'sup-1',
        supplierName: 'Daikin Lanka',
      };

      component.onItemSelected(mockItem);

      expect(component.selectedSupplier).toBe('Daikin Lanka');
      expect(component.autoSelectedSupplier).toBeTrue();
    });

    it('clears auto-selected supplier if item selection is cleared and cart is empty', () => {
      const { component } = setupWithMocks();
      component.ngOnInit();
      component.selectedSupplier = '';

      const mockItem: any = {
        _id: 'inv-item-1',
        name: 'Cooling Coil',
        sku: 'CC-01',
        supplierId: 'sup-1',
        supplierName: 'Daikin Lanka',
      };

      component.onItemSelected(mockItem);
      expect(component.selectedSupplier).toBe('Daikin Lanka');

      component.onItemCleared();
      expect(component.selectedSupplier).toBe('');
      expect(component.autoSelectedSupplier).toBeFalse();
    });

    it('filters availableInventoryItems to only items from selected supplier when supplier is selected first', () => {
      const { component } = setupWithMocks();
      component.ngOnInit();

      // Setup 2 inventory items: one for Daikin Lanka, one for Carrier Air
      component.inventoryItems = [
        { _id: 'i-1', name: 'Daikin Filter', sku: 'DF-01', supplierId: 'sup-1', supplierName: 'Daikin Lanka' } as any,
        { _id: 'i-2', name: 'Carrier Motor', sku: 'CM-01', supplierId: 'sup-2', supplierName: 'Carrier Air' } as any,
      ];

      // No supplier selected: all items available
      component.selectedSupplier = '';
      expect(component.availableInventoryItems.length).toBe(2);

      // Select Daikin Lanka: only Daikin Filter available
      component.onSupplierSelected('Daikin Lanka');
      expect(component.availableInventoryItems.length).toBe(1);
      expect(component.availableInventoryItems[0].name).toBe('Daikin Filter');

      // Select Carrier Air: only Carrier Motor available
      component.onSupplierSelected('Carrier Air');
      expect(component.availableInventoryItems.length).toBe(1);
      expect(component.availableInventoryItems[0].name).toBe('Carrier Motor');
    });

    it('displays all items when registering a new supplier or after a new supplier is added', () => {
      const { component, orderService } = setupWithMocks();
      component.ngOnInit();

      component.inventoryItems = [
        { _id: 'i-1', name: 'Daikin Filter', sku: 'DF-01', supplierId: 'sup-1', supplierName: 'Daikin Lanka' } as any,
        { _id: 'i-2', name: 'Carrier Motor', sku: 'CM-01', supplierId: 'sup-2', supplierName: 'Carrier Air' } as any,
      ];

      // Existing supplier selected: 1 item
      component.onSupplierSelected('Daikin Lanka');
      expect(component.availableInventoryItems.length).toBe(1);

      // User starts registering a new supplier
      component.onRegisteringNewSupplier(true);
      expect(component.availableInventoryItems.length).toBe(2);

      // User adds the new supplier
      orderService.addSupplier.and.returnValue(of({
        _id: 'sup-new-3',
        name: 'Universal Spare Parts Ltd',
      }));
      component.onAddNewSupplier('Universal Spare Parts Ltd');

      // Now the newly added supplier is selected, and ALL items are displayed
      expect(component.selectedSupplier).toBe('Universal Spare Parts Ltd');
      expect(component.availableInventoryItems.length).toBe(2);
    });
  });
});

