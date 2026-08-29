import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ApiService } from '../../../../core/services/api.service';
import { MaterialRequestApprovalComponent } from './material-request-approval.component';

describe('MaterialRequestApprovalComponent contract', () => {
  let component: MaterialRequestApprovalComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/material-requests`;
  const request = {
    materialRequestId: 'JMR-1', ticketId: 'job-1', requestType: 'Installation', customerName: 'Fixture Customer',
    location: 'Fixture site', status: 'Pending', approvalStatus: 'PENDING', financeNotes: '', total: 200,
    materials: [{ name: 'Pipe', sku: 'PIPE-1', quantity: 2, unitPrice: 100, total: 200 }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiService, provideHttpClient(), provideHttpClientTesting()] });
    component = new MaterialRequestApprovalComponent(TestBed.inject(ApiService));
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads pending requests and sends Finance decisions by canonical request ID', () => {
    component.load();
    http.expectOne(baseUrl).flush({ success: true, data: [request] });
    component.approve();
    const approve = http.expectOne(`${baseUrl}/JMR-1/approve-finance`);
    expect(approve.request.method).toBe('PATCH');
    approve.flush({ success: true });
    http.expectOne(baseUrl).flush({ success: true, data: [] });
  });

  it('requires and submits a rejection reason', () => {
    component.load();
    http.expectOne(baseUrl).flush({ success: true, data: [request] });
    component.rejectionReason = 'Cost needs revision';
    component.reject();
    const reject = http.expectOne(`${baseUrl}/JMR-1/reject-finance`);
    expect(reject.request.body).toEqual({ reason: 'Cost needs revision' });
    reject.flush({ success: true });
    http.expectOne(baseUrl).flush({ success: true, data: [] });
  });
});
