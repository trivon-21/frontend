import { of, throwError } from 'rxjs';
import { PurchaseRequestRejectedComponent } from './purchase-request-rejected.component';
import { PurchaseRequestItem, PurchaseRequestService } from '../../services/purchase-request.service';

describe('PurchaseRequestRejectedComponent', () => {
  let component: PurchaseRequestRejectedComponent;
  let mockRequestService: jasmine.SpyObj<PurchaseRequestService>;

  const mockRejectedRequests: PurchaseRequestItem[] = [
    {
      _id: 'pr-101',
      requestId: 'PR-2026-101',
      requestedBy: 'Alice Walker',
      items: [{ name: 'Pallet Jack', quantity: 1, unitPrice: 1200 }],
      totalEstimate: 1200,
      reason: 'Warehouse replacement',
      status: 'rejected',
      statusVersion: 1,
      createdAt: '2026-08-15T09:00:00.000Z',
    },
    {
      _id: 'pr-102',
      requestId: 'PR-2026-102',
      requestedBy: 'Bob Martin',
      items: [{ name: 'Gauge Manifold', quantity: 2, unitPrice: 200 }],
      totalEstimate: 400,
      notes: 'Budget exceeded for quarter',
      status: 'rejected',
      statusVersion: 1,
      createdAt: '2026-08-16T14:30:00.000Z',
    },
  ];

  beforeEach(() => {
    mockRequestService = jasmine.createSpyObj<PurchaseRequestService>(
      'PurchaseRequestService',
      ['getRejectedRequests']
    );
    mockRequestService.getRejectedRequests.and.returnValue(of(mockRejectedRequests));
    component = new PurchaseRequestRejectedComponent(mockRequestService);
  });

  it('loads rejected requests on init', () => {
    component.ngOnInit();

    expect(mockRequestService.getRejectedRequests).toHaveBeenCalled();
    expect(component.requests).toEqual(mockRejectedRequests);
    expect(component.isLoading).toBeFalse();
  });

  it('handles error gracefully when loadRequests fails', () => {
    spyOn(console, 'error');
    mockRequestService.getRejectedRequests.and.returnValue(
      throwError(() => new Error('Failed to load rejected requests'))
    );

    component.ngOnInit();

    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('filters requests by requestedBy, reason, and notes', () => {
    component.ngOnInit();

    component.searchQuery = 'Alice';
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].requestedBy).toBe('Alice Walker');

    component.searchQuery = 'replacement';
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].reason).toBe('Warehouse replacement');

    component.searchQuery = 'budget';
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].notes).toBe('Budget exceeded for quarter');

    component.searchQuery = 'unknown';
    expect(component.filteredRequests.length).toBe(0);

    component.searchQuery = '';
    expect(component.filteredRequests.length).toBe(2);
  });

  it('formats request reference correctly', () => {
    expect(component.getRequestRef(mockRejectedRequests[0])).toBe('PR-2026-101');

    const withoutRequestId: PurchaseRequestItem = {
      _id: '507f1f77bcf86cd799439022',
      requestId: '',
      requestedBy: 'Test',
      items: [],
      totalEstimate: 0,
      reason: 'Test',
      status: 'rejected',
      statusVersion: 1,
    };
    expect(component.getRequestRef(withoutRequestId)).toBe('PR-439022');
    expect(component.getRequestRef(null)).toBe('—');
  });

  it('opens and closes modal with selected request', () => {
    component.openModal(mockRejectedRequests[0]);
    expect(component.selectedRequest).toBe(mockRejectedRequests[0]);
    expect(component.showModal).toBeTrue();

    component.closeModal();
    expect(component.selectedRequest).toBeNull();
    expect(component.showModal).toBeFalse();
  });
});
