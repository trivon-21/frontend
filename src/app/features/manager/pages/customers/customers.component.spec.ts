import { of, throwError } from 'rxjs';
import { CustomersComponent } from './customers.component';
import {
  ManagerCustomersService,
  CustomerDirectoryItem,
  CustomerDetailData,
} from '../../services/manager-customers.service';

describe('CustomersComponent unit tests', () => {
  let service: jasmine.SpyObj<ManagerCustomersService>;
  let component: CustomersComponent;

  const mockCustomers: CustomerDirectoryItem[] = [
    {
      _id: 'cust-1',
      fullName: 'Kasun',
      lastName: 'Perera',
      email: 'kasun@example.com',
      phoneNumber: '0771234567',
      address: 'Colombo',
      gender: 'Male',
      isActive: true,
      totalInstances: 2,
      breakdown: {
        orders: 1,
        services: 1,
        installations: 0,
        inquiries: 0,
      },
      lastInteractionDate: '2026-08-01T00:00:00.000Z',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  const mockSummary = {
    totalCustomers: 10,
    activeCustomers: 9,
    customersWithHistory: 6,
    totalInstances: 18,
  };

  const mockDetailData: CustomerDetailData = {
    customer: {
      _id: 'cust-1',
      fullName: 'Kasun',
      lastName: 'Perera',
      email: 'kasun@example.com',
      phoneNumber: '0771234567',
      address: 'Colombo',
      gender: 'Male',
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    totalInstances: 2,
    instances: [
      {
        id: 'inst-1',
        type: 'Product Order',
        reference: 'ORD-101',
        summary: 'Buy Only Order - Completed',
        date: '2026-05-01T00:00:00.000Z',
        status: 'Completed',
      },
      {
        id: 'inst-2',
        type: 'Service / Repair',
        reference: 'SR-201',
        summary: 'Repair: ALX-18K (Gas leak)',
        date: '2026-05-20T00:00:00.000Z',
        status: 'Completed',
      },
    ],
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<ManagerCustomersService>('ManagerCustomersService', [
      'getCustomers',
      'getCustomerDetails',
      'lookupOrder',
    ]);

    service.getCustomers.and.returnValue(
      of({
        success: true,
        summary: mockSummary,
        customers: mockCustomers,
        pagination: {
          total: 1,
          page: 1,
          limit: 12,
          totalPages: 1,
        },
      })
    );

    service.getCustomerDetails.and.returnValue(
      of({
        success: true,
        data: mockDetailData,
      })
    );

    service.lookupOrder.and.returnValue(
      of({
        success: true,
        data: {
          id: 'ord-123',
          category: 'Product Order',
          reference: 'SRQ-1008',
          orderType: 'Repair',
          status: 'Completed',
          paymentStatus: 'Approved',
          orderStatus: 'Delivered',
          customer: { fullName: 'Kasun Perera' },
          total: 15000,
          createdAt: '2026-05-01T00:00:00.000Z',
        },
      })
    );

    component = new CustomersComponent(service);
  });

  it('loads customers and summary on initialization', () => {
    component.ngOnInit();

    expect(service.getCustomers).toHaveBeenCalled();
    expect(component.customers.length).toBe(1);
    expect(component.customers[0].fullName).toBe('Kasun');
    expect(component.customers[0].totalInstances).toBe(2);
    expect(component.summary.totalCustomers).toBe(10);
    expect(component.isLoading).toBeFalse();
  });

  it('updates status filter and resets page to 1', () => {
    component.setStatusFilter('with-instances');

    expect(component.selectedStatus).toBe('with-instances');
    expect(component.currentPage).toBe(1);
    expect(service.getCustomers).toHaveBeenCalled();
  });

  it('opens details modal and loads customer historical instances', () => {
    component.viewCustomerDetails(mockCustomers[0]);

    expect(component.showDetailsModal).toBeTrue();
    expect(service.getCustomerDetails).toHaveBeenCalledWith('cust-1');
    expect(component.selectedCustomerDetails).toEqual(mockDetailData);
    expect(component.selectedCustomerDetails?.instances.length).toBe(2);
    expect(component.isLoadingDetails).toBeFalse();
  });

  it('closes details modal and clears selected customer', () => {
    component.viewCustomerDetails(mockCustomers[0]);
    expect(component.showDetailsModal).toBeTrue();

    component.closeDetailsModal();
    expect(component.showDetailsModal).toBeFalse();
    expect(component.selectedCustomerDetails).toBeNull();
  });

  it('closes modal on escape key press', () => {
    component.showDetailsModal = true;
    component.onEscapePress();
    expect(component.showDetailsModal).toBeFalse();
  });

  it('handles error when loading customer details fails', () => {
    service.getCustomerDetails.and.returnValue(
      throwError(() => ({ error: { message: 'Customer record missing' } }))
    );

    component.viewCustomerDetails(mockCustomers[0]);
    expect(component.isLoadingDetails).toBeFalse();
    expect(component.detailError).toBe('Customer record missing');
  });

  it('correctly formats initials and date', () => {
    expect(component.getInitials('Kasun Perera')).toBe('KP');
    expect(component.getInitials('Kasun')).toBe('KA');
    expect(component.getInitials('')).toBe('CU');
    expect(component.formatDate(null)).toBe('—');
  });

  it('correctly classifies instance badge class', () => {
    expect(component.getInstanceTypeBadgeClass('Product Order')).toBe('badge-order');
    expect(component.getInstanceTypeBadgeClass('Service / Repair')).toBe('badge-service');
    expect(component.getInstanceTypeBadgeClass('Installation Job')).toBe('badge-installation');
    expect(component.getInstanceTypeBadgeClass('Inquiry')).toBe('badge-inquiry');
  });

  it('performs order lookup and opens order detail modal', () => {
    component.orderSearchRef = 'SRQ-1008';
    component.lookupOrder();

    expect(service.lookupOrder).toHaveBeenCalledWith('SRQ-1008');
    expect(component.showOrderModal).toBeTrue();
    expect(component.selectedOrder?.reference).toBe('SRQ-1008');
    expect(component.orderLoading).toBeFalse();
  });

  it('handles lookup order from customer instance click', () => {
    component.viewInstanceOrder(mockDetailData.instances[0]);

    expect(service.lookupOrder).toHaveBeenCalledWith('ORD-101');
    expect(component.showOrderModal).toBeTrue();
    expect(component.orderLoading).toBeFalse();
  });

  it('closes order modal and clears selection', () => {
    component.orderSearchRef = 'SRQ-1008';
    component.lookupOrder();
    expect(component.showOrderModal).toBeTrue();

    component.closeOrderModal();
    expect(component.showOrderModal).toBeFalse();
    expect(component.selectedOrder).toBeNull();
  });
});
