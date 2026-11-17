import { of, throwError } from 'rxjs';
import { PurchaseRequestApprovedComponent } from './purchase-request-approved.component';
import { PurchaseRequestItem, PurchaseRequestService } from '../../services/purchase-request.service';

describe('PurchaseRequestApprovedComponent', () => {
  let component: PurchaseRequestApprovedComponent;
  let mockRequestService: jasmine.SpyObj<PurchaseRequestService>;

  const mockApprovedRequests: PurchaseRequestItem[] = [
    {
      _id: 'pr-1',
      requestId: 'PR-2026-001',
      requestedBy: 'John Doe',
      items: [{ name: 'Filter', quantity: 10, unitPrice: 50 }],
      totalEstimate: 500,
      reason: 'Regular maintenance stock',
      status: 'approved',
      statusVersion: 1,
      createdAt: '2026-08-20T10:00:00.000Z',
    },
    {
      _id: 'pr-2',
      requestId: 'PR-2026-002',
      requestedBy: 'Jane Smith',
      items: [{ name: 'Capacitor', quantity: 5, unitPrice: 30 }],
      totalEstimate: 150,
      notes: 'High priority customer',
      status: 'approved',
      statusVersion: 1,
      createdAt: '2026-08-21T11:00:00.000Z',
    },
  ];

  beforeEach(() => {
    mockRequestService = jasmine.createSpyObj<PurchaseRequestService>(
      'PurchaseRequestService',
      ['getApprovedRequests']
    );
    mockRequestService.getApprovedRequests.and.returnValue(of(mockApprovedRequests));
    component = new PurchaseRequestApprovedComponent(mockRequestService);
  });

  it('loads approved requests on init', () => {
    component.ngOnInit();

    expect(mockRequestService.getApprovedRequests).toHaveBeenCalled();
    expect(component.requests).toEqual(mockApprovedRequests);
    expect(component.isLoading).toBeFalse();
  });

  it('handles error gracefully when loadRequests fails', () => {
    spyOn(console, 'error');
    mockRequestService.getApprovedRequests.and.returnValue(
      throwError(() => new Error('Failed to load'))
    );

    component.ngOnInit();

    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('filters requests by requestedBy, reason, and notes', () => {
    component.ngOnInit();

    component.searchQuery = 'Jane';
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].requestedBy).toBe('Jane Smith');

    component.searchQuery = 'maintenance';
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].reason).toBe('Regular maintenance stock');

    component.searchQuery = 'priority';
    expect(component.filteredRequests.length).toBe(1);
    expect(component.filteredRequests[0].notes).toBe('High priority customer');

    component.searchQuery = 'nonexistent';
    expect(component.filteredRequests.length).toBe(0);

    component.searchQuery = '   ';
    expect(component.filteredRequests.length).toBe(2);
  });

  it('formats request reference correctly', () => {
    expect(component.getRequestRef(mockApprovedRequests[0])).toBe('PR-2026-001');

    const withoutRequestId: PurchaseRequestItem = {
      _id: '507f1f77bcf86cd799439011',
      requestId: '',
      requestedBy: 'Test',
      items: [],
      totalEstimate: 0,
      reason: 'Test',
      status: 'approved',
      statusVersion: 1,
    };
    expect(component.getRequestRef(withoutRequestId)).toBe('PR-439011');
    expect(component.getRequestRef(null)).toBe('—');
  });

  it('opens and closes modal with selected request', () => {
    component.openModal(mockApprovedRequests[0]);
    expect(component.selectedRequest).toBe(mockApprovedRequests[0]);
    expect(component.showModal).toBeTrue();

    component.closeModal();
    expect(component.selectedRequest).toBeNull();
    expect(component.showModal).toBeFalse();
  });
});
