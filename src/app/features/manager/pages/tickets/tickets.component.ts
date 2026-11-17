import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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
  @ViewChild('detailsCloseButton') detailsCloseButton?: ElementRef<HTMLButtonElement>;
  items: OperationalWorkItem[] = [];
  selectedItem: OperationalWorkItem | null = null;
  summary: WorkItemSummary = {
    total: 0, open: 0, inProgress: 0, escalated: 0, awaitingVerification: 0, closed: 0,
  };
  status = 'Syncing…';
  loading = false;
  loadError = '';
  page = 1;
  limit = 25;
  total = 0;
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
  private detailsTrigger: HTMLElement | null = null;

  constructor(private readonly ticketsService: TicketsService, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.activeStatus = this.accepted(params.get('status'), this.statusFilters);
      this.activeType = this.accepted(params.get('type'), this.typeFilters);
      this.activePriority = this.accepted(params.get('priority'), this.priorityFilters);
      this.activeAssignment = this.accepted(params.get('assignment'), ['all', 'assigned', 'unassigned']);
      this.activeSla = this.accepted(params.get('sla'), ['all', 'overdue']);
      this.page = 1;
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.ticketsService.getWorkItems({
      status: this.activeStatus,
      type: this.activeType,
      priority: this.activePriority,
      assignment: this.activeAssignment,
      sla: this.activeSla,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (response) => {
        this.items = response.items;
        this.summary = response.summary;
        this.status = response.status;
        this.page = response.page;
        this.limit = response.limit;
        this.total = response.total;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Operations could not be loaded. Check your connection and try again.';
        this.status = 'Offline';
        this.loading = false;
      },
    });
  }

  setFilter(kind: 'status' | 'type' | 'priority', value: string): void {
    if (kind === 'status') this.activeStatus = value;
    if (kind === 'type') this.activeType = value;
    if (kind === 'priority') this.activePriority = value;
    this.page = 1;
    this.load();
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.limit)); }
  get firstResult(): number { return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1; }
  get lastResult(): number { return Math.min(this.page * this.limit, this.total); }

  changePage(nextPage: number): void {
    if (this.loading || nextPage < 1 || nextPage > this.totalPages || nextPage === this.page) return;
    this.page = nextPage;
    this.load();
  }

  openDetails(item: OperationalWorkItem, trigger?: HTMLElement): void {
    if (trigger) this.detailsTrigger = trigger;
    this.selectedItem = item;
    this.selectedPriority = item.priority;
    this.selectedSla = item.slaDueAt ? this.toLocalDateTime(item.slaDueAt) : '';
    this.actionReason = '';
    this.errorMessage = '';
    setTimeout(() => this.detailsCloseButton?.nativeElement.focus());
  }

  closeDetails(): void {
    if (this.updatingId) return;
    this.selectedItem = null;
    this.actionReason = '';
    this.errorMessage = '';
    const trigger = this.detailsTrigger;
    this.detailsTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  onDetailsBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeDetails();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeDetails(); }

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
