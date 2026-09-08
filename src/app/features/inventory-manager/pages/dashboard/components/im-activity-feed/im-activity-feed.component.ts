import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { IconMappingService } from '../../../../../../shared/services/icon-mapping.service';
import { ActivityItem } from '../../../../services/inventory-manager-dashboard.service';

@Component({
  selector: 'app-im-activity-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './im-activity-feed.component.html',
  styleUrl: './im-activity-feed.component.css',
})
export class ImActivityFeedComponent {
  @Input({ required: true }) activities!: ActivityItem[];

  constructor(
    private readonly iconMappingService: IconMappingService,
    private readonly router: Router,
  ) {}

  getActivityIcon(type: string): string {
    return this.iconMappingService.getActivityIcon(type);
  }

  handleActivityAction(activity: ActivityItem): void {
    const routes: Record<string, string> = {
      'View GRN': '/inventory-manager/procurement',
      'View Asset': '/inventory-manager/asset-management',
      'View Log': '/inventory-manager/asset-management',
      'View Order': '/inventory-manager/order-creation',
      'View Procurement': '/inventory-manager/procurement',
      'View Returns': '/inventory-manager/returns-rma',
      'View RMA': '/inventory-manager/returns-rma',
      'View Quarantine': '/inventory-manager/returns-rma',
    };
    const route = routes[activity.actionLabel || ''];
    if (route) {
      this.router.navigate([route]);
    }
  }
}
