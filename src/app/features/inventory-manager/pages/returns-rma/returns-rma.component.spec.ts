import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { InventoryManagerDashboardService, RmaCaseItem } from '../../services/inventory-manager-dashboard.service';
import { ReturnsRmaDashboardComponent } from './returns-rma.component';

describe('ReturnsRmaDashboardComponent', () => {
  let component: ReturnsRmaDashboardComponent;
  let http: HttpTestingController;
  let dashboardService: InventoryManagerDashboardService;
  const baseUrl = `${environment.apiUrl}/inventory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryManagerDashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    dashboardService = TestBed.inject(InventoryManagerDashboardService);
    component = new ReturnsRmaDashboardComponent(dashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('advances reported RMA case to under-review', () => {
    const rma: RmaCaseItem = {
      _id: '1',
      rmaId: 'RMA-001',
      serialNumber: 'SN-001',
      itemName: 'Vacuum Pump',
      itemSku: 'VP-01',
      faultDescription: 'Motor failure',
      reportedBy: 'Tech 1',
      status: 'reported',
      type: 'Single',
      resolution: '',
      createdAt: '2026-08-20T00:00:00.000Z',
    };

    spyOn(component, 'refreshData');
    component.advanceRmaStatus(rma);

    const req = http.expectOne(`${baseUrl}/rma-cases/RMA-001`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'under-review' });
    req.flush({ ...rma, status: 'under-review' });

    expect(component.refreshData).toHaveBeenCalled();
  });

  it('sends under-review case to supplier', () => {
    const rma: RmaCaseItem = {
      _id: '2',
      rmaId: 'RMA-002',
      serialNumber: 'SN-002',
      itemName: 'Recovery Machine',
      itemSku: 'RM-01',
      faultDescription: 'Compressor burnt',
      reportedBy: 'Tech 2',
      status: 'under-review',
      type: 'Single',
      resolution: '',
      createdAt: '2026-08-20T00:00:00.000Z',
    };

    spyOn(component, 'refreshData');
    component.sendToSupplier(rma);

    const req = http.expectOne(`${baseUrl}/rma-cases/RMA-002`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'sent-to-supplier' });
    req.flush({ ...rma, status: 'sent-to-supplier' });

    expect(component.refreshData).toHaveBeenCalled();
  });

  it('resolves RMA via internal repair with required notes', () => {
    const rma: RmaCaseItem = {
      _id: '3',
      rmaId: 'RMA-003',
      serialNumber: 'SN-003',
      itemName: 'Gauge Set',
      itemSku: 'GS-01',
      faultDescription: 'Loose valve',
      reportedBy: 'Tech 3',
      status: 'under-review',
      type: 'Single',
      resolution: '',
      createdAt: '2026-08-20T00:00:00.000Z',
    };

    component.openInternalRepairModal(rma);
    expect(component.showInternalRepairModal).toBeTrue();
    expect(component.internalRepairRma).toBe(rma);

    component.internalRepairNote = 'Tightened valve stem and pressure tested';
    spyOn(component, 'refreshData');
    component.submitInternalRepair();

    const req = http.expectOne(`${baseUrl}/rma-cases/RMA-003`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      status: 'resolved',
      resolutionType: 'internal-repair',
      resolution: 'Tightened valve stem and pressure tested',
      resolutionNote: 'Tightened valve stem and pressure tested',
    });
    req.flush({ ...rma, status: 'resolved', resolutionType: 'internal-repair' });

    expect(component.showInternalRepairModal).toBeFalse();
    expect(component.internalRepairRma).toBeNull();
    expect(component.refreshData).toHaveBeenCalled();
  });

  it('receives supplier replacement with serial number and notes', () => {
    const rma: RmaCaseItem = {
      _id: '4',
      rmaId: 'RMA-004',
      serialNumber: 'SN-OLD-004',
      itemName: 'Flaring Tool',
      itemSku: 'FT-01',
      faultDescription: 'Worn cone',
      reportedBy: 'Tech 4',
      status: 'replacement-pending',
      type: 'Single',
      resolution: '',
      createdAt: '2026-08-20T00:00:00.000Z',
    };

    component.openReplacementModal(rma);
    expect(component.showReplacementModal).toBeTrue();
    expect(component.replacementRma).toBe(rma);

    component.replacementSerialNumber = 'SN-NEW-004';
    component.replacementNotes = 'Delivered under DO-8891';
    spyOn(component, 'refreshData');
    component.submitReplacementReceipt();

    const req = http.expectOne(`${baseUrl}/rma-cases/RMA-004/replacement`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      serialNumber: 'SN-NEW-004',
      notes: 'Delivered under DO-8891',
    });
    req.flush({ success: true });

    expect(component.showReplacementModal).toBeFalse();
    expect(component.replacementRma).toBeNull();
    expect(component.refreshData).toHaveBeenCalled();
  });
});
