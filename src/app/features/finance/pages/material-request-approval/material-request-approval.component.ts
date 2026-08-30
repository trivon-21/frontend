import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

interface FinanceMaterialLine {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FinanceMaterialRequest {
  materialRequestId: string;
  ticketId: string;
  requestType: string;
  customerName: string;
  location: string;
  status: string;
  approvalStatus: string;
  financeNotes: string;
  total: number;
  materials: FinanceMaterialLine[];
  statusVersion: number;
}

@Component({
  selector: 'app-material-request-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './material-request-approval.component.html',
  styleUrls: ['./material-request-approval.component.css'],
})
export class MaterialRequestApprovalComponent implements OnInit {
  requests: FinanceMaterialRequest[] = [];
  selected: FinanceMaterialRequest | null = null;
  rejectionReason = '';
  loading = true;
  saving = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.get<{ success: boolean; data: FinanceMaterialRequest[] }>('/material-requests').subscribe({
      next: response => {
        this.requests = (response.data || []).filter(request => request.approvalStatus === 'PENDING');
        this.selected = this.requests[0] || null;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Material requests could not be loaded.';
        this.loading = false;
      },
    });
  }

  approve(): void {
    if (!this.selected || this.saving) return;
    this.decide('approve-finance', this.versionBody());
  }

  reject(): void {
    if (!this.selected || this.saving) return;
    if (!this.rejectionReason.trim()) {
      this.error = 'Enter a rejection reason.';
      return;
    }
    this.decide('reject-finance', {
      reason: this.rejectionReason.trim(),
      ...this.versionBody(),
    });
  }

  private versionBody(): Record<string, number> {
    return this.selected?.statusVersion === undefined ? {} : { statusVersion: this.selected.statusVersion };
  }

  private decide(action: string, body: Record<string, unknown>): void {
    this.saving = true;
    this.error = '';
    this.api.patch(`/material-requests/${this.selected!.materialRequestId}/${action}`, body).subscribe({
      next: () => {
        this.saving = false;
        this.rejectionReason = '';
        this.load();
      },
      error: err => {
        this.saving = false;
        this.error = err.error?.message || 'The Finance decision could not be saved.';
      },
    });
  }
}
