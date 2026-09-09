import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PortalIconsModule } from '../../../../../../shared/components/portal-icons/portal-icons.module';
import { IconMappingService } from '../../../../../../shared/services/icon-mapping.service';
import { ActivityItem } from '../../../../services/inventory-manager-dashboard.service';

const PORTAL_BASE = '/inventory-manager';

const ACTIVITY_ROUTES: Record<string, string> = {
  'View GRN': `${PORTAL_BASE}/procurement`,
  'Receive Stock': `${PORTAL_BASE}/procurement`,
  'View Authorization': `${PORTAL_BASE}/procurement`,
  'View Asset': `${PORTAL_BASE}/asset-management`,
  'View Log': `${PORTAL_BASE}/asset-management`,
  'View Order': `${PORTAL_BASE}/order-creation`,
  'View Returns': `${PORTAL_BASE}/returns-rma`,
  'View RMA': `${PORTAL_BASE}/returns-rma`,
  'View Quarantine': `${PORTAL_BASE}/returns-rma`,
  'View Dispatch': `${PORTAL_BASE}/dispatch-logistics`,
};

/**
 * The feed carries activities authored by other portals too, so a label may have
 * no destination here (e.g. 'View Ticket'). Unresolved labels return null and the
 * button is not rendered rather than rendering a button that cannot navigate.
 */
function resolveActivityRoute(activity: ActivityItem): string | null {
  const label = activity.actionLabel;
  if (!label) return null;
  // 'View Request' is emitted by both the material-kit and the purchase-request
  // workflows; the title is the only field that separates them.
  if (label === 'View Request') {
    return activity.title?.startsWith('Material Kit')
      ? `${PORTAL_BASE}/material-requests`
      : `${PORTAL_BASE}/order-creation`;
  }
  return ACTIVITY_ROUTES[label] ?? null;
}

export interface ActivityFeedRow {
  activity: ActivityItem;
  route: string | null;
}

@Component({
  selector: 'app-im-activity-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, PortalIconsModule],
  templateUrl: './im-activity-feed.component.html',
  styleUrl: './im-activity-feed.component.css',
})
export class ImActivityFeedComponent {
  @Input({ required: true }) activities!: ActivityItem[];
  @Input() limit: number | null = null;

  constructor(private readonly iconMappingService: IconMappingService) {}

  get visibleActivities(): ActivityFeedRow[] {
    const visible =
      !this.limit || this.limit >= this.activities.length
        ? this.activities
        : this.activities.slice(0, this.limit);
    return visible.map((activity) => ({ activity, route: resolveActivityRoute(activity) }));
  }

  getActivityIcon(type: string): string {
    return this.iconMappingService.getActivityIcon(type);
  }
}
