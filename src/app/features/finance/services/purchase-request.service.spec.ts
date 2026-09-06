import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PurchaseRequestService } from './purchase-request.service';

describe('PurchaseRequestService canonical contract', () => {
  let service: PurchaseRequestService;
  let http: HttpTestingController;
  const expectedBase = `${(environment.apiUrl || '/api').replace(/\/api\/?$/, '')}/api/finance-workflow`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PurchaseRequestService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PurchaseRequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('queries canonical purchase request endpoints using configured environment URL', () => {
    service.getPendingRequests().subscribe();
    const pendingReq = http.expectOne(`${expectedBase}/purchase-requests?status=pending-finance`);
    expect(pendingReq.request.method).toBe('GET');
    pendingReq.flush([]);

    service.getApprovedRequests().subscribe();
    const approvedReq = http.expectOne(`${expectedBase}/purchase-requests?status=approved`);
    expect(approvedReq.request.method).toBe('GET');
    approvedReq.flush([]);

    service.getRejectedRequests().subscribe();
    const rejectedReq = http.expectOne(`${expectedBase}/purchase-requests?status=rejected`);
    expect(rejectedReq.request.method).toBe('GET');
    rejectedReq.flush([]);
  });

  it('sends canonical decision payload with statusVersion for approval and rejection', () => {
    service.approveRequest('request-1', 3, 'Approved by Finance Officer').subscribe();
    let request = http.expectOne(`${expectedBase}/purchase-requests/request-1/decision`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      decision: 'approved',
      comment: 'Approved by Finance Officer',
      statusVersion: 3,
    });
    request.flush({ _id: 'request-1', status: 'approved', statusVersion: 4 });

    service.rejectRequest('request-2', 'Insufficient evidence', 7).subscribe();
    request = http.expectOne(`${expectedBase}/purchase-requests/request-2/decision`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      decision: 'rejected',
      comment: 'Insufficient evidence',
      statusVersion: 7,
    });
    request.flush({ _id: 'request-2', status: 'rejected', statusVersion: 8 });
  });
});
