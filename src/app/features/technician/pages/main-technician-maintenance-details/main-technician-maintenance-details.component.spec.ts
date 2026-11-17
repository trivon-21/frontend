import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainTechnicianMaintenanceDetailsComponent } from './main-technician-maintenance-details.component';

describe('MainTechnicianMaintenanceDetailsComponent', () => {
  let component: MainTechnicianMaintenanceDetailsComponent;
  let fixture: ComponentFixture<MainTechnicianMaintenanceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainTechnicianMaintenanceDetailsComponent],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainTechnicianMaintenanceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
