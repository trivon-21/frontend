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

@Injectable({
  providedIn: 'root',
})
export class SystemInfoService {
  private systemInfoSubject = new BehaviorSubject<SystemInfo>({
    systemName: 'AirLux',
    supportEmail: 'support@airlux.lk',
    supportPhoneNumber: '+94 11 234 5678',
    address: '123 Galle Road, Colombo 03, Sri Lanka',
  });

  public systemInfo$ = this.systemInfoSubject.asObservable();

  constructor(private apiService: ApiService) {
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
            if (typeof document !== 'undefined') {
              document.title = data.systemName || 'AirLux';
            }
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
}
