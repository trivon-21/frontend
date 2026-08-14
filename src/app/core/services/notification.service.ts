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
}
