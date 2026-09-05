import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PurchaseRequestService } from './purchase-request.service';

describe('PurchaseRequestService concurrency contract', () => {
  let service: PurchaseRequestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PurchaseRequestService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PurchaseRequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends statusVersion for legacy approval and rejection adapters', () => {
    service.approveRequest('request-1', 3).subscribe();
    let request = http.expectOne('http://127.0.0.1:5000/api/purchase-requests/approve/request-1');
    expect(request.request.body).toEqual({ statusVersion: 3 });
    request.flush({});

    service.rejectRequest('request-2', 'Insufficient evidence', 7).subscribe();
    request = http.expectOne('http://127.0.0.1:5000/api/purchase-requests/reject/request-2');
    expect(request.request.body).toEqual({ rejectionReason: 'Insufficient evidence', statusVersion: 7 });
    request.flush({});
  });
});
