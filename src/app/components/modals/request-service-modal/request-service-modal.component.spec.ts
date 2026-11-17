import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RequestServiceModalComponent } from './request-service-modal.component';
import { CustomerServiceRequestService } from '../../../features/customer/services/customer-service-request.service';
import { PaymentService } from '../../../core/services/payment.service';

describe('RequestServiceModalComponent', () => {
  let component: RequestServiceModalComponent;
  let fixture: ComponentFixture<RequestServiceModalComponent>;
  let mockSrService: jasmine.SpyObj<CustomerServiceRequestService>;
  let mockPaymentService: jasmine.SpyObj<PaymentService>;

  beforeEach(async () => {
    mockSrService = jasmine.createSpyObj('CustomerServiceRequestService', ['getCharges', 'createServiceRequest']);
    mockPaymentService = jasmine.createSpyObj('PaymentService', ['getBankDetails']);

    mockSrService.getCharges.and.returnValue(of({
      success: true,
      maintenanceFee: 6000,
      repairFee: 7500,
      charges: []
    }));

    mockPaymentService.getBankDetails.and.returnValue(of({
      success: true,
      data: {
        bankName: 'Commercial Bank',
        accountNumber: '1000234567',
        accountName: 'AirLux Technologies Pvt Ltd',
        branch: 'Colombo 03',
        currency: 'LKR'
      }
    }));

    await TestBed.configureTestingModule({
      imports: [RequestServiceModalComponent],
      providers: [
        { provide: CustomerServiceRequestService, useValue: mockSrService },
        { provide: PaymentService, useValue: mockPaymentService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RequestServiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with only Repair and Maintenance service types', () => {
    expect(component.serviceTypes).toEqual(['Repair', 'Maintenance']);
    expect(component.serviceTypes.length).toBe(2);
  });

  it('loads dynamic charges from database service', () => {
    expect(mockSrService.getCharges).toHaveBeenCalled();
    expect(component.maintenanceFee).toBe(6000);
    expect(component.repairFee).toBe(7500);
  });

  it('loads bank details from payment service', () => {
    expect(mockPaymentService.getBankDetails).toHaveBeenCalled();
    expect(component.bankDetails.bankName).toBe('Commercial Bank');
    expect(component.bankDetails.accountNumber).toBe('1000234567');
  });

  it('emits a history event from the My Requests action', () => {
    const historySpy = jasmine.createSpy('history');
    component.viewHistory.subscribe(historySpy);

    component.openHistory();

    expect(historySpy).toHaveBeenCalled();
  });

  it('configures 4 steps and requires payment slip for Maintenance', () => {
    component.step = 2;
    component.serviceType = 'Maintenance';

    expect(component.totalSteps).toBe(4);
    expect(component.estimatedCharges).toBe(6000);

    // Try to advance from payment step without slip
    component.step = 3;
    component.nextStep();
    expect(component.step).toBe(3);
    expect(component.error).toContain('upload your bank payment slip');

    // Provide slip and advance
    component.base64Slip = 'data:image/png;base64,sample';
    component.nextStep();
    expect(component.step).toBe(4);
    expect(component.isSummaryStep).toBeTrue();
  });

  it('configures 3 steps and advances directly to summary for Repair', () => {
    component.step = 2;
    component.serviceType = 'Repair';

    expect(component.totalSteps).toBe(3);

    component.nextStep();
    expect(component.step).toBe(3);
    expect(component.isSummaryStep).toBeTrue();
  });

  it('rejects unsupported file formats during slip upload', () => {
    const invalidFile = new File(['test'], 'file.exe', { type: 'application/x-msdownload' });
    component.setFile(invalidFile);

    expect(component.uploadedFile).toBeNull();
    expect(component.error).toContain('Only PDF, JPG, PNG, or WEBP files are allowed');
  });
});
