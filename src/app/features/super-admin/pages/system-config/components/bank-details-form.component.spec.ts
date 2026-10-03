import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BankDetailsFormComponent } from './bank-details-form.component';
import { SystemConfig } from '../../../models/system-config.model';

describe('BankDetailsFormComponent', () => {
  let component: BankDetailsFormComponent;
  let fixture: ComponentFixture<BankDetailsFormComponent>;

  const mockConfig: SystemConfig = {
    _id: 'config123',
    businessRules: {
      standardMaintenanceFee: 6000,
      standardRepairFee: 7500,
      standardSiteInspectionFee: 5000,
      profitMargin: 0.25,
      logRetentionDays: 30,
      paymentAutoCancelDays: 14,
      defaultWarrantyMonths: 24,
      amcContractMonths: 12,
      maxRescheduleAttempts: 3,
    },
    featureFlags: {
      amcModuleEnabled: true,
      warrantyModuleEnabled: true,
      preventiveMaintenanceEnabled: true,
      customerFeedbackEnabled: true,
      deliveryTrackingEnabled: true,
    },
    maintenance: {
      isActive: false,
      message: '',
      reason: '',
      startTime: null,
      endTime: null,
      scheduledStartTime: null,
      scheduledEndTime: null,
    },
    systemInfo: {
      systemName: 'AirLux',
      supportEmail: 'support@airlux.lk',
      supportPhoneNumber: '+94 11 234 5678',
      address: '123 Galle Road, Colombo',
    },
    bankDetails: {
      _id: 'bank123',
      bankName: 'Commercial Bank',
      branch: 'Negombo',
      accountName: 'Airlux Engineering (Pvt) Ltd',
      accountNumber: '8001234567',
      type: 'Current',
      currency: 'LKR',
    },
    updatedBy: null,
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, BankDetailsFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BankDetailsFormComponent);
    component = fixture.componentInstance;
    component.config = mockConfig;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form controls with required validators', () => {
    expect(component.form.contains('bankName')).toBeTrue();
    expect(component.form.contains('branch')).toBeTrue();
    expect(component.form.contains('accountName')).toBeTrue();
    expect(component.form.contains('accountNumber')).toBeTrue();
    expect(component.form.contains('type')).toBeTrue();
    expect(component.form.contains('currency')).toBeTrue();
    expect(component.form.contains('reason')).toBeTrue();
  });

  it('should patch values from config on ngOnChanges', () => {
    component.ngOnChanges();
    expect(component.form.get('bankName')?.value).toBe('Commercial Bank');
    expect(component.form.get('branch')?.value).toBe('Negombo');
    expect(component.form.get('accountName')?.value).toBe('Airlux Engineering (Pvt) Ltd');
    expect(component.form.get('accountNumber')?.value).toBe('8001234567');
    expect(component.form.get('type')?.value).toBe('Current');
    expect(component.form.get('currency')?.value).toBe('LKR');
  });

  it('should validate accountNumber as numeric with min length 6', () => {
    const accNumberControl = component.form.get('accountNumber');

    accNumberControl?.setValue('abc');
    expect(accNumberControl?.valid).toBeFalse();

    accNumberControl?.setValue('123');
    expect(accNumberControl?.valid).toBeFalse();

    accNumberControl?.setValue('8001234567');
    expect(accNumberControl?.valid).toBeTrue();
  });

  it('should emit updated bank details on submit when values are changed', () => {
    component.ngOnChanges();
    spyOn(component.save, 'emit');

    component.form.patchValue({
      branch: 'Colombo 03',
      reason: 'Updating branch for corporate accounts',
    });
    component.form.markAsDirty();

    component.onSubmit();
    expect(component.save.emit).toHaveBeenCalledWith({
      bankDetails: { branch: 'Colombo 03' },
      reason: 'Updating branch for corporate accounts',
    });
  });

  it('should render customer preview card with bank information', () => {
    component.ngOnChanges();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Commercial Bank');
    expect(compiled.textContent).toContain('Negombo');
    expect(compiled.textContent).toContain('Airlux Engineering (Pvt) Ltd');
    expect(compiled.textContent).toContain('8001234567');
  });
});
