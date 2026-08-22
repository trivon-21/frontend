import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LocalIconComponent } from '../../../../shared/components/local-icon/local-icon.component';
import { FormsModule } from '@angular/forms';
import { FinanceSummary, ManagerDashboardData, ManagerDashboardService } from '../../services/manager-dashboard.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LocalIconComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.css',
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  financeSummary: FinanceSummary | null = null;
  financePeriod: '7d' | '30d' | '12m' = '30d';
  data: ManagerDashboardData = {
    managerName: 'Manager',
    currentDate: new Date(),
    status: 'Syncing',
    stats: {
      openTickets: { total: 0, subStats: [] },
      unassignedTickets: { total: 0, subStats: [] },
      slaRisk: { total: 0, subStats: [] },
      pendingApprovals: { total: 0, subStats: [] },
    },
    inventoryKpis: {
      reservedItems: { label: 'Reserved Items', value: 0, icon: 'clipboard-check' },
      lowStockAlerts: { label: 'Low Stock Alerts', value: 0, icon: 'triangle-alert' },
      pendingMaterialRequests: { label: 'Pending Material Requests', value: 0, icon: 'package' },
    },
    recentActivity: [],
    pendingActions: [],
  };
  loading = true;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private dashboardService: ManagerDashboardService) {}

  ngOnInit(): void {
    this.loadData();
    this.timer = setInterval(() => {
      if (this.data) this.data.currentDate = new Date();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  loadData(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe((data) => {
      this.data = data;
      this.loading = false;
    });
    this.loadFinanceSummary();
  }

  loadFinanceSummary(): void {
    this.dashboardService.getFinanceSummary(this.financePeriod).subscribe((summary) => this.financeSummary = summary);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getActivityIcon(type: string): string {
    if (type === 'escalation') return 'triangle-alert';
    if (type === 'order') return 'shopping-bag';
    return 'clipboard-list';
  }

  getPriorityClass(priority: string): string {
    return priority === 'high' ? 'critical' : priority === 'medium' ? 'warning' : 'normal';
  }
}
