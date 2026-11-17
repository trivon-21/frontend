import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BusinessRulesFormComponent } from './business-rules-form.component';
import { SystemConfig } from '../../../models/system-config.model';

describe('BusinessRulesFormComponent', () => {
  let component: BusinessRulesFormComponent;
  let fixture: ComponentFixture<BusinessRulesFormComponent>;

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
    updatedBy: null,
    updatedAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, BusinessRulesFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessRulesFormComponent);
    component = fixture.componentInstance;
    component.config = mockConfig;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with standard fee controls and exclude quotationApprovalThreshold', () => {
    expect(component.form.contains('quotationApprovalThreshold')).toBeFalse();
    expect(component.form.contains('standardMaintenanceFee')).toBeTrue();
    expect(component.form.contains('standardRepairFee')).toBeTrue();
    expect(component.form.contains('standardSiteInspectionFee')).toBeTrue();
    expect(component.form.contains('profitMargin')).toBeTrue();
  });

  it('should patch values from config on ngOnChanges', () => {
    component.ngOnChanges();
    expect(component.form.get('standardMaintenanceFee')?.value).toBe(6000);
    expect(component.form.get('standardRepairFee')?.value).toBe(7500);
    expect(component.form.get('standardSiteInspectionFee')?.value).toBe(5000);
    expect(component.form.get('profitMargin')?.value).toBe(25);
  });

  it('should emit updated fees on submit when values are changed', () => {
    component.ngOnChanges();
    spyOn(component.save, 'emit');

    component.form.patchValue({ standardMaintenanceFee: 6500 });
    component.form.markAsDirty();

    component.onSubmit();
    expect(component.save.emit).toHaveBeenCalledWith({ standardMaintenanceFee: 6500 });
  });

  it('should render standard fee input labels in template', () => {
    component.ngOnChanges();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Standard Maintenance Service Fee (LKR)');
    expect(compiled.textContent).toContain('Standard Repair Service Fee (LKR)');
    expect(compiled.textContent).toContain('Standard Site Inspection Fee (LKR)');
    expect(compiled.textContent).toContain('Inventory Profit Margin (%)');
    expect(compiled.textContent).not.toContain('Quotation Approval Threshold (LKR)');
  });
});
