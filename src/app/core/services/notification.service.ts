import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Notification {
  id: string;
  type: 'order' | 'inquiry' | 'service' | 'feedback' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  inquiryResponses: boolean;
  serviceRequests: boolean;
  feedbackConfirmation: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  constructor(private api: ApiService) {
    this.loadNotifications();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void {
    this.api.post<{ data: Notification }>('/customer/notifications', notification).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Failed to create notification', err)
    });
  }

  markAsRead(id: string): void {
    this.api.patch(`/customer/notifications/${id}/read`, {}).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Failed to mark notification as read', err)
    });
  }

  markAllAsRead(): void {
    this.api.patch('/customer/notifications/read-all', {}).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Failed to mark all notifications as read', err)
    });
  }

  clearNotifications(): void {
    this.api.delete('/customer/notifications').subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Failed to clear notifications', err)
    });
  }

  deleteNotification(id: string): void {
    this.api.delete(`/customer/notifications/${id}`).subscribe({
      next: () => this.loadNotifications(),
      error: (err) => console.error('Failed to delete notification', err)
    });
  }

  getPreferences(): Observable<{ data: NotificationPreferences }> {
    return this.api.get<{ data: NotificationPreferences }>('/customer/notifications/preferences');
  }

  updatePreferences(preferences: NotificationPreferences): Observable<{ data: NotificationPreferences }> {
    return this.api.put<{ data: NotificationPreferences }>('/customer/notifications/preferences', preferences);
  }

  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter((n) => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  private loadNotifications(): void {
    this.api.get<{ data: Notification[] }>('/customer/notifications').subscribe({
      next: (response) => {
        this.notificationsSubject.next(response.data || []);
        this.updateUnreadCount();
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.notificationsSubject.next([]);
        this.updateUnreadCount();
      }
    });
  }

  // Helper wrappers used by existing call sites.
  notifyOrderUpdate(orderRef: string, status: string): void {
    this.createNotification({
      type: 'order',
      title: `Order ${orderRef} Updated`,
      message: `Your order status is now: ${status}`,
      read: false,
      actionUrl: '/dashboard/orders'
    });
  }

  notifyInquiryResponse(inquiryId: string): void {
    this.createNotification({
      type: 'inquiry',
      title: 'New Response',
      message: 'You have a new response to your inquiry',
      read: false,
      actionUrl: `/dashboard`
    });
  }

  notifyServiceRequest(requestId: string, status: string): void {
    this.createNotification({
      type: 'service',
      title: 'Service Request Update',
      message: `Your service request status: ${status}`,
      read: false,
      actionUrl: '/dashboard'
    });
  }

  notifyFeedback(message: string): void {
    this.createNotification({
      type: 'feedback',
      title: 'Feedback Submitted',
      message,
      read: false
    });
  }

  notifyGeneral(title: string, message: string): void {
    this.createNotification({
      type: 'general',
      title,
      message,
      read: false
    });
  }
}
