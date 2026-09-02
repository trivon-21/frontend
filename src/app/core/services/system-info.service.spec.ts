import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { SystemInfoService } from './system-info.service';

describe('SystemInfoService browser title', () => {
  let apiService: jasmine.SpyObj<ApiService>;
  let originalTitle: string;

  beforeEach(() => {
    originalTitle = document.title;
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        SystemInfoService,
        { provide: ApiService, useValue: apiService },
      ],
    });
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('uses AirLux immediately while system configuration is loading', () => {
    apiService.get.and.returnValue(NEVER);

    TestBed.inject(SystemInfoService);

    expect(document.title).toBe('AirLux');
  });

  it('uses the configured system name after it loads', () => {
    apiService.get.and.returnValue(of({
      success: true,
      data: {
        systemName: 'AirLux Operations',
        supportEmail: 'support@example.test',
        supportPhoneNumber: '+94 11 000 0000',
        address: 'Example address',
      },
    }));

    TestBed.inject(SystemInfoService);

    expect(document.title).toBe('AirLux Operations');
  });

  it('retains AirLux when system configuration cannot be loaded', () => {
    spyOn(console, 'error');
    apiService.get.and.returnValue(throwError(() => new Error('offline')));

    TestBed.inject(SystemInfoService);

    expect(document.title).toBe('AirLux');
  });
});
