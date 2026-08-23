import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LocalIconComponent } from '../../../../shared/components/local-icon/local-icon.component';
import { InventoryManagerDashboardService, ActivityItem } from '../../services/inventory-manager-dashboard.service';
import { IconMappingService } from '../../../../shared/services/icon-mapping.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, RouterModule, LocalIconComponent],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.css']
})
export class ActivityLogComponent implements OnInit {
  activities: ActivityItem[] = [];
  loading = true;

  constructor(
    private dashboardService: InventoryManagerDashboardService,
    private iconMappingService: IconMappingService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getActivityLog().subscribe({
      next: (data) => {
        this.activities = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getActivityIcon(type: string): string {
    return this.iconMappingService.getActivityIcon(type);
  }
}
