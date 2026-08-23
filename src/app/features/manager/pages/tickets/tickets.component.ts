import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  OperationalWorkItem,
  TicketsService,
  WorkItemAction,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemSummary,
} from '../../services/tickets.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
})
export class TicketsComponent implements OnInit {
  items: OperationalWorkItem[] = [];
  selectedItem: OperationalWorkItem | null = null;
  summary: WorkItemSummary = {
    total: 0, open: 0, inProgress: 0, escalated: 0, awaitingVerification: 0, closed: 0,
  };
  status = 'Syncing…';
  loading = false;
  updatingId: string | null = null;
  errorMessage = '';
  actionReason = '';
  selectedPriority: WorkItemPriority = 'medium';
  selectedSla = '';
  readonly statusFilters: Array<'all' | WorkItemStatus> = [
    'all', 'open', 'ready', 'assigned', 'scheduled', 'in-progress', 'blocked',
    'awaiting-payment', 'payment-review', 'awaiting-verification', 'escalated', 'closed', 'cancelled',
  ];
  readonly typeFilters = ['all', 'service', 'inspection', 'installation', 'maintenance'];
  readonly priorityFilters = ['all', 'high', 'medium', 'low'];
  activeStatus = 'all';
  activeType = 'all';
  activePriority = 'all';
  activeAssignment = 'all';
  activeSla = 'all';

  constructor(private readonly ticketsService: TicketsService, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.activeStatus = this.accepted(params.get('status'), this.statusFilters);
      this.activeType = this.accepted(params.get('type'), this.typeFilters);
      this.activePriority = this.accepted(params.get('priority'), this.priorityFilters);
      this.activeAssignment = this.accepted(params.get('assignment'), ['all', 'assigned', 'unassigned']);
      this.activeSla = this.accepted(params.get('sla'), ['all', 'overdue']);
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.ticketsService.getWorkItems({
      status: this.activeStatus,
      type: this.activeType,
      priority: this.activePriority,
      assignment: this.activeAssignment,
      sla: this.activeSla,
    }).subscribe((response) => {
      this.items = response.items;
      this.summary = response.summary;
      this.status = response.status;
      this.loading = false;
    });
  }

  setFilter(kind: 'status' | 'type' | 'priority', value: string): void {
    if (kind === 'status') this.activeStatus = value;
    if (kind === 'type') this.activeType = value;
    if (kind === 'priority') this.activePriority = value;
    this.load();
  }

  openDetails(item: OperationalWorkItem): void {
    this.selectedItem = item;
    this.selectedPriority = item.priority;
    this.selectedSla = item.slaDueAt ? this.toLocalDateTime(item.slaDueAt) : '';
    this.actionReason = '';
    this.errorMessage = '';
  }

  closeDetails(): void { this.selectedItem = null; }

  saveControls(): void {
    if (!this.selectedItem) return;
    const sla = this.selectedSla ? new Date(this.selectedSla).toISOString() : null;
    this.execute(this.ticketsService.updateControl(this.selectedItem, this.selectedPriority, sla));
  }

  runAction(action: Exclude<WorkItemAction, 'update-control'>): void {
    if (!this.selectedItem || !this.actionReason.trim()) {
      this.errorMessage = 'Enter a reason before changing escalation or closure.';
      return;
    }
    this.execute(this.ticketsService.runAction(this.selectedItem, action, this.actionReason.trim()));
  }

  can(action: WorkItemAction): boolean {
    return Boolean(this.selectedItem?.allowedActions.includes(action));
  }

  statusLabel(status: WorkItemStatus): string {
    return status.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  slaText(item: OperationalWorkItem): string {
    if (!item.slaDueAt) return 'Not set';
    if (item.managerClosed) return 'Closed';
    const hours = Math.ceil((item.slaDueAt.getTime() - Date.now()) / 3600000);
    if (hours <= 0) return 'Overdue';
    return hours < 24 ? `${hours}h left` : `${Math.ceil(hours / 24)}d left`;
  }

  slaOverdue(item: OperationalWorkItem): boolean {
    return Boolean(item.slaDueAt && !item.managerClosed && item.slaDueAt.getTime() <= Date.now());
  }

  trackItem(_index: number, item: OperationalWorkItem): string { return item.id; }

  private execute(request: ReturnType<TicketsService['updateControl']>): void {
    if (!this.selectedItem) return;
    this.updatingId = this.selectedItem.id;
    this.errorMessage = '';
    request.subscribe({
      next: (updated) => {
        this.updatingId = null;
        this.openDetails(updated);
        this.load();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'The work item could not be updated.';
        this.updatingId = null;
      },
    });
  }

  private accepted(value: string | null, values: readonly string[]): string {
    return value && values.includes(value) ? value : 'all';
  }

  private toLocalDateTime(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
}
