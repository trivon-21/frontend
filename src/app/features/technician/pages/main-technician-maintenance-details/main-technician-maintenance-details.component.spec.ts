import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainTechnicianMaintenanceDetails } from './main-technician-maintenance-details';

describe('MainTechnicianMaintenanceDetails', () => {
  let component: MainTechnicianMaintenanceDetails;
  let fixture: ComponentFixture<MainTechnicianMaintenanceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainTechnicianMaintenanceDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainTechnicianMaintenanceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
