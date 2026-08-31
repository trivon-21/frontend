import { ActivatedRoute, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { OrdersComponent } from './orders.component';
import { OrdersService, PurchaseRequest } from '../../services/orders.service';

describe('OrdersComponent decision dialog', () => {
  it('requires a comment and retains the dialog input after a conflict', () => {
    const service = {
      decide: jasmine.createSpy().and.returnValue(throwError(() => ({ status: 409, error: { message: 'Version conflict' } }))),
    } as unknown as OrdersService;
    const component = new OrdersComponent(
      service,
      {} as ActivatedRoute,
      { navigate: jasmine.createSpy() } as unknown as Router,
    );
    const order = { _id: 'order-1', requestId: 'REQ-001', statusVersion: 2 } as PurchaseRequest;
    component.openDecision('purchase', order, 'rejected', order.requestId);

    component.submitDecision();
    expect(component.decisionError).toContain('required');
    expect(service.decide).not.toHaveBeenCalled();

    component.decisionComment = 'Budget and operational scope do not match.';
    component.submitDecision();

    expect(component.decisionTarget).not.toBeNull();
    expect(component.decisionComment).toBe('Budget and operational scope do not match.');
    expect(component.decisionError).toBe('Version conflict');
    expect(component.decisionPending).toBeFalse();
  });

  it('does not dismiss an in-flight decision through Escape', () => {
    const component = new OrdersComponent(
      {} as OrdersService,
      {} as ActivatedRoute,
      {} as Router,
    );
    component.decisionTarget = {
      kind: 'purchase',
      record: { _id: 'order-1' } as PurchaseRequest,
      decision: 'approved',
      reference: 'REQ-001',
    };
    component.decisionPending = true;

    component.onEscape();

    expect(component.decisionTarget).not.toBeNull();
  });
});
