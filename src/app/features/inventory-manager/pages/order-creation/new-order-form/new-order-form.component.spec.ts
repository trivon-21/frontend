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
});
