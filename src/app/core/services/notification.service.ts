import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'order' | 'inquiry' | 'service' | 'feedback' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);

  constructor() {
    this.loadNotifications();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    const current = this.notifications$.value;
    this.notifications$.next([newNotification, ...current]);
    this.updateUnreadCount();

    // Save to localStorage
    this.saveNotifications();
  }

  markAsRead(id: string): void {
    const notifications = this.notifications$.value.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notifications$.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  markAllAsRead(): void {
    const notifications = this.notifications$.value.map(n => ({ ...n, read: true }));
    this.notifications$.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  clearNotifications(): void {
    this.notifications$.next([]);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  deleteNotification(id: string): void {
    const notifications = this.notifications$.value.filter(n => n.id !== id);
    this.notifications$.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  private updateUnreadCount(): void {
    const count = this.notifications$.value.filter(n => !n.read).length;
    this.unreadCount$.next(count);
  }

  private saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications$.value));
  }

  private loadNotifications(): void {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      this.notifications$.next(JSON.parse(saved));
    }
    this.updateUnreadCount();
  }

  // Helper methods for specific notification types
  notifyOrderUpdate(orderRef: string, status: string): void {
    this.addNotification({
      type: 'order',
      title: `Order ${orderRef} Updated`,
      message: `Your order status is now: ${status}`,
      read: false,
      actionUrl: '/dashboard/orders'
    });
  }

  notifyInquiryResponse(inquiryId: string): void {
    this.addNotification({
      type: 'inquiry',
      title: 'New Response',
      message: 'You have a new response to your inquiry',
      read: false,
      actionUrl: `/dashboard`
    });
  }

  notifyServiceRequest(requestId: string, status: string): void {
    this.addNotification({
      type: 'service',
      title: 'Service Request Update',
      message: `Your service request status: ${status}`,
      read: false,
      actionUrl: '/dashboard'
    });
  }

  notifyFeedback(message: string): void {
    this.addNotification({
      type: 'feedback',
      title: 'Feedback Submitted',
      message,
      read: false
    });
  }

  notifyGeneral(title: string, message: string): void {
    this.addNotification({
      type: 'general',
      title,
      message,
      read: false
    });
  }
}
