import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseRequestItem, PurchaseRequestService } from '../../services/purchase-request.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

@Component({
  selector: 'app-purchase-request-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-request-verification.component.html',
  styleUrls: ['./purchase-request-verification.component.css']
})
export class PurchaseRequestVerificationComponent implements OnInit {

  requests: PurchaseRequestItem[] = [];
  searchQuery = '';
  showDetailsModal = false;
  showRejectModal = false;
  selectedRequest: PurchaseRequestItem | null = null;
  rejectionReason = '';
  reasonError = false;
  isLoading = false;

  constructor(
    private requestService: PurchaseRequestService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void { this.loadRequests(); }

  loadRequests(): void {
    this.isLoading = true;
    this.requestService.getPendingRequests().subscribe({
      next: (data) => { this.requests = data; this.isLoading = false; },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  get filteredRequests(): PurchaseRequestItem[] {
    if (!this.searchQuery.trim()) return this.requests;
    const q = this.searchQuery.toLowerCase();
    return this.requests.filter(r =>
      r.requestedBy?.toLowerCase().includes(q) ||
      (r.reason || r.notes)?.toLowerCase().includes(q)
    );
  }

  getRequestRef(r: PurchaseRequestItem | null): string {
    if (!r) return '—';
    return r.requestId || (r._id ? `PR-${r._id.toString().slice(-6).toUpperCase()}` : '—');
  }

  openDetailsModal(request: PurchaseRequestItem) { this.selectedRequest = request; this.showDetailsModal = true; }
  closeDetailsModal() { this.showDetailsModal = false; this.selectedRequest = null; }

  async approveRequest(request: PurchaseRequestItem): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Approve Purchase Request',
      message: `Approve purchase request from ${request.requestedBy}?`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isLoading = true;
    this.requestService.approveRequest(request._id, request.statusVersion).subscribe({
      next: () => {
        this.notificationService.show('Purchase request approved! Confirmation email sent.', 'success');
        this.requests = this.requests.filter(r => r._id !== request._id);
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; this.notificationService.show('Approval failed.', 'error'); }
    });
  }

  openRejectModal(request: PurchaseRequestItem): void {
    this.selectedRequest = request; this.rejectionReason = ''; this.reasonError = false; this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false; this.selectedRequest = null; this.rejectionReason = ''; this.reasonError = false;
  }

  rejectRequest(): void {
    if (!this.selectedRequest) return;
    if (!this.rejectionReason.trim()) { this.reasonError = true; return; }
    this.reasonError = false;
    this.isLoading = true;
    this.requestService.rejectRequest(
      this.selectedRequest._id,
      this.rejectionReason,
      this.selectedRequest.statusVersion,
    ).subscribe({
      next: () => {
        this.notificationService.show('Purchase request rejected. Email sent.', 'success');
        this.requests = this.requests.filter(r => r._id !== this.selectedRequest?._id);
        this.closeRejectModal();
        this.isLoading = false;
      },
      error: (err) => { console.error(err); this.isLoading = false; this.notificationService.show('Rejection failed.', 'error'); }
    });
  }

  getItemsTotal(items: any[]): number {
    return (items || []).reduce((s, i) => s + (i.total || i.estimatedTotal || 0), 0);
  }
}
