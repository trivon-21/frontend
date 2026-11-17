import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class IconMappingService {
  /**
   * Maps activity types to Lucide icon names
   */
  activityIconMap: { [key: string]: string } = {
    return: 'rotate-ccw',
    dispatch: 'truck',
    grn: 'box',
    request: 'clipboard-list',
    alert: 'triangle-alert',
  };

  /**
   * Maps notification types to Lucide icon names
   */
  notificationIconMap: { [key: string]: string } = {
    order: 'package',
    inquiry: 'message-circle',
    service: 'wrench',
    feedback: 'star',
    general: 'bell',
  };

  constructor() {}

  /**
   * Get Lucide icon name for activity type
   */
  getActivityIcon(type: string): string {
    return this.activityIconMap[type] || 'circle';
  }

  /**
   * Get Lucide icon name for notification type
   */
  getNotificationIcon(type: string): string {
    return this.notificationIconMap[type] || 'bell';
  }
}
