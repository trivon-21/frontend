import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService, ServiceRequest } from '../../services/service-request.service';

@Component({
  selector: 'app-service-requests-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-requests-list-modal.component.html',
  styleUrl: './service-requests-list-modal.component.css',
})
export class ServiceRequestsListModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  requests: ServiceRequest[] = [];
  loading = true;
  error: string | null = null;
  selected: ServiceRequest | null = null;
  cancelling = false;
  cancelError: string | null = null;

  constructor(private srService: ServiceRequestService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.srService.getServiceRequests().subscribe({
      next: (list) => { this.requests = list; this.loading = false; },
      error: (err) => { this.error = err.error?.message || 'Failed to load service requests.'; this.loading = false; }
    });
  }

  close() { this.closed.emit(); }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  openDetail(req: ServiceRequest) {
    this.selected = { ...req };
    this.cancelError = null;
  }

  backToList() {
    this.selected = null;
    this.load();
  }

  canCancel(req: ServiceRequest): boolean {
    return req.status === 'Pending' || req.status === 'Assigned';
  }

  cancelRequest(req: ServiceRequest) {
    if (!confirm('Are you sure you want to cancel this service request?')) return;
    this.cancelling = true;
    this.cancelError = null;
    this.srService.cancelServiceRequest(req._id).subscribe({
      next: () => {
        this.cancelling = false;
        if (this.selected) this.selected = { ...this.selected, status: 'Cancelled' };
        this.load();
      },
      error: (err) => {
        this.cancelError = err.error?.message || 'Failed to cancel request.';
        this.cancelling = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Pending':    'badge--purple',
      'Assigned':   'badge--blue',
      'In Progress':'badge--orange',
      'Completed':  'badge--green',
      'Cancelled':  'badge--red',
    };
    return map[status] || '';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatAmount(n: number): string {
    return n === 0 ? 'Free' : `$${n}`;
  }

  get ongoing(): number { return this.requests.filter(r => ['Pending','Assigned','In Progress'].includes(r.status)).length; }
  get completed(): number { return this.requests.filter(r => r.status === 'Completed').length; }
  get cancelled(): number { return this.requests.filter(r => r.status === 'Cancelled').length; }

  private readonly STEP_ORDER = ['Pending', 'Assigned', 'In Progress', 'Completed'];
  isStepDone(step: string, currentStatus: string): boolean {
    return this.STEP_ORDER.indexOf(step) < this.STEP_ORDER.indexOf(currentStatus);
  }
}
