import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';
import { InventoryManagerDashboardService, ActivityItem } from '../../services/inventory-manager-dashboard.service';
import { IconMappingService } from '../../../../shared/services/icon-mapping.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.css']
})
export class ActivityLogComponent implements OnInit {
  activities: ActivityItem[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private dashboardService: InventoryManagerDashboardService,
    private iconMappingService: IconMappingService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dashboardService.getActivityLog().subscribe({
      next: (data) => {
        this.activities = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Activity history could not be loaded. Check your connection and try again.';
        this.loading = false;
      }
    });
  }

  getActivityIcon(type: string): string {
    return this.iconMappingService.getActivityIcon(type);
  }
}
