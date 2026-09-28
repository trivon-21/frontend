import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { CsaInquiryService, CustomerInquiry } from './csa-inquiry.service';

export interface InquiryPopupAlert {
  id: string;
  key: string;
  inquiryRef: string;
  customerName: string;
  type: 'new' | 'reply';
  title: string;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CsaAlertService {
  private alertsSubject = new BehaviorSubject<InquiryPopupAlert[]>([]);
  alerts$: Observable<InquiryPopupAlert[]> = this.alertsSubject.asObservable();

  // Backward compatibility alias
  activeAlert$: Observable<InquiryPopupAlert | null> = new Observable((observer) => {
    return this.alerts$.subscribe(alerts => observer.next(alerts.length > 0 ? alerts[0] : null));
  });

  private pollSubscription?: Subscription;
  private knownInquiries = new Map<string, { threadLength: number; status: string }>();
  private dismissedAlertKeys = new Set<string>();
  private isInitialized = false;

  constructor(
    private inquiryService: CsaInquiryService,
    private router: Router,
    private zone: NgZone
  ) {
    console.log('[CsaAlertService] Service instantiated and polling started');
    if (typeof window !== 'undefined') {
      (window as any).__csaAlertService = this;
    }
    this.startPolling();
  }

  startPolling(): void {
    // Check immediately
    this.checkInquiries();

    // Poll every 10 seconds for new customer activity
    this.pollSubscription = interval(10000).subscribe(() => {
      this.checkInquiries();
    });
  }

  private hasAlert(key: string): boolean {
    return this.alertsSubject.value.some(a => a.key === key);
  }

  private checkInquiries(): void {
    this.inquiryService.getInquiries({ limit: 15 }).subscribe({
      next: (res) => {
        if (!res || !res.inquiries) return;

        // Read popup preference from localStorage
        let popupEnabled = true;

        try {
          const stored = localStorage.getItem('csa_workspace_preferences');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.popupInquiryAlerts !== undefined) popupEnabled = parsed.popupInquiryAlerts;
          }
        } catch {
          // Defaults remain
        }

        const now = Date.now();

        // Detect new inquiries or incoming customer replies
        for (const inq of res.inquiries) {
          const inqId = inq._id ? inq._id.toString() : '';
          const known = this.knownInquiries.get(inqId);
          const currentThreadLen = inq.thread?.length || 0;
          const customerName = inq.customer?.fullName || inq.name || 'Customer';
          const createdAgo = inq.createdAt ? now - new Date(inq.createdAt).getTime() : 999999;

          if (!this.isInitialized) {
            // Record initial baseline
            this.knownInquiries.set(inqId, {
              threadLength: currentThreadLen,
              status: inq.status
            });

            // If a new inquiry arrived in the last 2 minutes, add to alert stack
            if (inq.status === 'Awaiting' && createdAgo < 120000) {
              const alertKey = `${inqId}_new`;
              if (popupEnabled && !this.dismissedAlertKeys.has(alertKey) && !this.hasAlert(alertKey)) {
                this.addAlert({
                  id: inqId,
                  key: alertKey,
                  inquiryRef: inq.inquiryRef,
                  customerName,
                  type: 'new',
                  title: 'New Customer Inquiry',
                  message: inq.subject || inq.message || 'New customer inquiry received',
                  timestamp: new Date()
                });
              }
            }
          } else {
            // Subsequent polling runs
            if (!known) {
              // Brand new inquiry arrived
              this.knownInquiries.set(inqId, {
                threadLength: currentThreadLen,
                status: inq.status
              });

              const alertKey = `${inqId}_new`;
              if (popupEnabled && !this.dismissedAlertKeys.has(alertKey) && !this.hasAlert(alertKey)) {
                this.addAlert({
                  id: inqId,
                  key: alertKey,
                  inquiryRef: inq.inquiryRef,
                  customerName,
                  type: 'new',
                  title: 'New Customer Inquiry',
                  message: inq.subject || inq.message || 'New customer inquiry received',
                  timestamp: new Date()
                });
              }
            } else if (currentThreadLen > known.threadLength) {
              // New reply added to thread
              const lastMsg = inq.thread[currentThreadLen - 1];
              this.knownInquiries.set(inqId, {
                threadLength: currentThreadLen,
                status: inq.status
              });

              if (lastMsg && lastMsg.sender === 'Customer') {
                const alertKey = `${inqId}_reply_${currentThreadLen}`;
                if (popupEnabled && !this.dismissedAlertKeys.has(alertKey)) {
                  this.addAlert({
                    id: inqId,
                    key: alertKey,
                    inquiryRef: inq.inquiryRef,
                    customerName,
                    type: 'reply',
                    title: 'Customer Replied',
                    message: lastMsg.message || inq.subject || 'Customer replied to ongoing inquiry',
                    timestamp: new Date()
                  });
                }
              }
            } else {
              known.status = inq.status;
            }
          }
        }

        if (!this.isInitialized) {
          this.isInitialized = true;
          console.log('[CsaAlertService] Initialized with baseline inquiries:', this.knownInquiries.size);
        }
      },
      error: () => {
        // Silently handle polling errors
      }
    });
  }

  addAlert(alert: InquiryPopupAlert): void {
    if (!alert.key) {
      alert.key = `${alert.id}_${alert.type}_${Date.now()}`;
    }
    this.zone.run(() => {
      const current = [...this.alertsSubject.value];
      const existingIndex = current.findIndex(a => a.id === alert.id);

      if (existingIndex !== -1) {
        // The inquiry already has an active card in the stack:
        // Do not add another card; update the existing card with the newest message in-place
        console.log('[CsaAlertService] 🔄 Updating existing notification card with newest message for:', alert.inquiryRef);
        current[existingIndex] = {
          ...current[existingIndex],
          key: alert.key,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp || new Date()
        };
        this.alertsSubject.next(current);
      } else {
        // No existing card for this inquiry in the stack: add to top of stack
        console.log('[CsaAlertService] 🔔 Adding new floating alert to stack:', alert.inquiryRef);
        this.alertsSubject.next([alert, ...current]);
      }
    });
    // Note: Do NOT auto-dismiss! Stays persistent until CSA clicks close (x) or Clear All.
  }

  triggerAlert(alert: InquiryPopupAlert): void {
    this.addAlert(alert);
  }

  dismissAlert(keyOrId: string): void {
    this.dismissedAlertKeys.add(keyOrId);
    this.zone.run(() => {
      const remaining = this.alertsSubject.value.filter(a => a.key !== keyOrId && a.id !== keyOrId);
      this.alertsSubject.next(remaining);
    });
  }

  clearAllAlerts(): void {
    for (const alert of this.alertsSubject.value) {
      if (alert.key) this.dismissedAlertKeys.add(alert.key);
      if (alert.id) this.dismissedAlertKeys.add(alert.id);
    }
    this.zone.run(() => {
      this.alertsSubject.next([]);
    });
  }

  openInquiry(inquiryId: string, alertKey?: string): void {
    if (alertKey) {
      this.dismissAlert(alertKey);
    } else {
      this.dismissAlert(inquiryId);
    }
    this.zone.run(() => {
      this.router.navigate(['/csa/inquiries'], {
        queryParams: { selectId: inquiryId }
      });
    });
  }
}
