import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface DashboardSummary {
  pendingReviews: number;
  activeJobs: number;
  serviceRequests: number;
  teamAvailable: number;
}

interface DashboardActivityApiItem {
  type: string;
  title: string;
  timestamp: string | Date;
}

interface DashboardActivityItem {
  svg: string;
  title: string;
  time: string;
}

interface DashboardAlertItem {
  title: string;
  subtitle: string;
  action: string;
  urgent: boolean;
}

@Component({
  selector: 'app-main-technician-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './main-technician-dashboard.component.html',
  styleUrl: './main-technician-dashboard.component.css'
})
export class MainTechnicianDashboardComponent implements OnInit {
  today = new Date();
  searchQuery = '';

  dashboardData: DashboardSummary = {
    pendingReviews: 0,
    activeJobs: 0,
    serviceRequests: 0,
    teamAvailable: 0
  };

  constructor(private router: Router, private http: HttpClient) {}

  /** Loads dashboard summary, activity, and alerts after the component starts. */
  ngOnInit(): void {
    this.fetchDashboardSummary();
    this.fetchRecentActivity();
    this.fetchUrgentAlerts();
  }

  /** Fetches the dashboard summary from the backend API. */
  fetchDashboardSummary(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/dashboard/summary`).subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
        }
      },
      error: (err) => {
        console.error('Error fetching dashboard summary:', err);
      }
    });
  }

  /** Fetches the latest activity items and maps them into the view model. */
  fetchRecentActivity(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/dashboard/activity?limit=5`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.activity = (response.data as DashboardActivityApiItem[]).map((item: DashboardActivityApiItem) => ({
            svg: this.getActivityIcon(item.type),
            title: item.title,
            time: this.formatTime(item.timestamp)
          }));
          this.filteredActivity = [...this.activity];
        }
      },
      error: (err) => {
        console.error('Error fetching activity:', err);
      }
    });
  }

  /** Fetches urgent alerts and mirrors them into the filtered list. */
  fetchUrgentAlerts(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/dashboard/alerts`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.alerts = response.data as DashboardAlertItem[];
          this.filteredAlerts = [...this.alerts];
        }
      },
      error: (err) => {
        console.error('Error fetching alerts:', err);
      }
    });
  }

  /** Returns the icon SVG for a dashboard activity type. */
  private getActivityIcon(type: string): string {
    const iconMap: Record<'inspection' | 'installation' | 'service', string> = {
      inspection: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
      installation: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
      service: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/><path d="m3 7 2 2"/><path d="m21 15-2-2"/></svg>`,
    };
    const normalizedType = type.toLowerCase();
    if (normalizedType === 'inspection' || normalizedType === 'installation' || normalizedType === 'service') {
      return iconMap[normalizedType];
    }
    return iconMap.inspection;
  }

  /** Converts a timestamp into a relative or formatted date string. */
  private formatTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  /** Navigates the user to the inspection review page. */
  navigateToInspections(): void {
    this.router.navigate(['/main-technician-inspection-reports']);
  }

  /** Navigates the user to the materials request page. */
  navigateToMaterials(): void {
    this.router.navigate(['/main-technician-materials']);
  }

  /** Navigates the user to the team management page. */
  navigateToTeamManagement(): void {
    this.router.navigate(['/main-technician-team-management']);
  }

  /** Handles the selected dashboard alert action. */
  onAlertAction(alert: DashboardAlertItem): void {
    if (alert.action === 'Assign') {
      this.router.navigate(['/main-technician-team-management']);
    } else if (alert.action === 'Review') {
      this.router.navigate(['/main-technician-materials']);
    }
  }

  activity: DashboardActivityItem[] = [];
  alerts: DashboardAlertItem[] = [];

  filteredActivity: DashboardActivityItem[] = [];
  filteredAlerts: DashboardAlertItem[] = [];

  /** Reapplies the dashboard search filter to activity and alerts. */
  private applySearch(): void {
    const normalized = this.searchQuery.toLowerCase();

    if (!normalized) {
      this.filteredActivity = [...this.activity];
      this.filteredAlerts = [...this.alerts];
      return;
    }

    this.filteredActivity = this.activity.filter((item) => {
      return item.title.toLowerCase().includes(normalized) || item.time.toLowerCase().includes(normalized);
    });

    this.filteredAlerts = this.alerts.filter((alert) => {
      return (
        alert.title.toLowerCase().includes(normalized) ||
        alert.subtitle.toLowerCase().includes(normalized) ||
        alert.action.toLowerCase().includes(normalized)
      );
    });
  }
}

