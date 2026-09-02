import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface SystemInfo {
  systemName: string;
  supportEmail: string;
  supportPhoneNumber: string;
  address: string;
}

const DEFAULT_SYSTEM_INFO: SystemInfo = {
  systemName: 'AirLux',
  supportEmail: 'support@airlux.lk',
  supportPhoneNumber: '+94 11 234 5678',
  address: '123 Galle Road, Colombo 03, Sri Lanka',
};

@Injectable({
  providedIn: 'root',
})
export class SystemInfoService {
  private systemInfoSubject = new BehaviorSubject<SystemInfo>(DEFAULT_SYSTEM_INFO);

  public systemInfo$ = this.systemInfoSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.setDocumentTitle(DEFAULT_SYSTEM_INFO.systemName);
    this.loadSystemInfo();
  }

  loadSystemInfo(): void {
    this.apiService
      .get<{ success: boolean; data: SystemInfo }>('/config/system-info')
      .pipe(
        map((res) => (res && res.success ? res.data : null)),
        tap((data) => {
          if (data) {
            this.systemInfoSubject.next(data);
            this.setDocumentTitle(data.systemName);
          }
        })
      )
      .subscribe({
        error: (err) => console.error('Failed to load system config details', err),
      });
  }

  getSystemInfo(): SystemInfo {
    return this.systemInfoSubject.value;
  }

  private setDocumentTitle(systemName: string | null | undefined): void {
    if (typeof document !== 'undefined') {
      document.title = systemName?.trim() || DEFAULT_SYSTEM_INFO.systemName;
    }
  }
}
