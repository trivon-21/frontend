import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseRequestItem, PurchaseRequestService } from '../../services/purchase-request.service';

@Component({
  selector: 'app-purchase-request-approved',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-request-approved.component.html',
  styleUrls: ['./purchase-request-approved.component.css']
})
export class PurchaseRequestApprovedComponent implements OnInit {

  requests: PurchaseRequestItem[] = [];
  searchQuery = '';
  selectedRequest: PurchaseRequestItem | null = null;
  showModal = false;
  isLoading = false;

  constructor(private requestService: PurchaseRequestService) { }

  ngOnInit(): void { this.loadRequests(); }

  loadRequests(): void {
    this.isLoading = true;
    this.requestService.getApprovedRequests().subscribe({
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

  openModal(request: PurchaseRequestItem) { this.selectedRequest = request; this.showModal = true; }
  closeModal() { this.selectedRequest = null; this.showModal = false; }
}