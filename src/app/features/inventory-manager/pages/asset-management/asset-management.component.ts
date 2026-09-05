import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { forkJoin } from 'rxjs';

interface ActiveLoan {
  _id?: string;
  id?: string;
  toolId: string;
  serializedAssetId?: string | { _id: string; serialNumber: string; status: string };
  toolName: string;
  assetTag: string;
  technicianId: string;
  technicianName: string;
  checkedOutAt: string;
  dueDate: string;
  status?: 'On Time' | 'Overdue';
}

interface ReturnLog {
  toolName: string;
  assetTag: string;
  technicianName: string;
  checkedOutAt: string;
  returnedAt: string;
  condition?: 'good' | 'damaged' | 'incomplete';
}

type ReturnCondition = 'good' | 'damaged' | 'incomplete';

import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalIconsModule],
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.css'],
})
export class AssetManagementDashboardComponent implements OnInit {
  activeTab: 'loans' | 'logs' = 'loans';
  searchQuery: string = '';

  technicians: any[] = [];
  tools: any[] = [];
  loans: ActiveLoan[] = [];
  returnLogs: ReturnLog[] = [];

  // Form states
  selectedTechnicianId: string = '';
  selectedToolId: string = '';
  selectedAssetTag: string = '';
  dueDate: string = '';
  validationMessage = '';
  loading = true;
  loadError = '';
  checkingOut = false;
  returningIds = new Set<string>();
  returnConditions: Record<string, ReturnCondition> = {};
  showReturnModal = false;
  activeReturnLoan: ActiveLoan | null = null;
  returnCondition: ReturnCondition = 'good';
  returnNotes = '';

  setActiveTab(tab: 'loans' | 'logs') {
    this.activeTab = tab;
  }

  get filteredLoans() {
    const query = (this.searchQuery || '').toLowerCase().trim();
    if (!query) return this.loans;
    return this.loans.filter(
      (l) =>
        l.toolName?.toLowerCase().includes(query) ||
        l.assetTag?.toLowerCase().includes(query) ||
        l.technicianName?.toLowerCase().includes(query),
    );
  }

  get filteredReturnLogs() {
    const query = (this.searchQuery || '').toLowerCase().trim();
    if (!query) return this.returnLogs;
    return this.returnLogs.filter(
      (l) =>
        l.toolName?.toLowerCase().includes(query) ||
        l.assetTag?.toLowerCase().includes(query) ||
        l.technicianName?.toLowerCase().includes(query),
    );
  }

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      technicians: this.apiService.get<any[]>('/inventory/technicians'),
      tools: this.apiService.get<any[]>('/inventory/available-tools'),
      loans: this.apiService.get<ActiveLoan[]>('/inventory/asset-loans'),
      returnLogs: this.apiService.get<ReturnLog[]>('/inventory/asset-return-logs'),
    }).subscribe({
      next: ({ technicians, tools, loans, returnLogs }) => {
        this.technicians = technicians;
        this.tools = tools;
        this.loans = this.withLoanStatus(loans);
        this.returnLogs = returnLogs;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Tool lending data could not be loaded. No partial data has been shown.';
        this.loading = false;
      },
    });
  }

  fetchAvailableTools() {
    this.apiService.get<any[]>('/inventory/available-tools').subscribe({
      next: (data) => this.tools = data,
      error: () => this.validationMessage = 'Available tools could not be refreshed.',
    });
  }

  get selectedToolAssetTags(): string[] {
    return this.tools.find((tool) => tool._id === this.selectedToolId)?.availableSerialNumbers || [];
  }

  onToolSelected(): void {
    this.selectedAssetTag = '';
  }

  fetchLoans() {
    this.apiService.get<ActiveLoan[]>('/inventory/asset-loans').subscribe({
      next: (data) => this.loans = this.withLoanStatus(data),
      error: () => this.validationMessage = 'The loan list could not be refreshed.',
    });
  }

  fetchReturnLogs() {
    this.apiService
      .get<ReturnLog[]>('/inventory/asset-return-logs')
      .subscribe({
        next: (data) => this.returnLogs = data,
        error: () => this.validationMessage = 'Return logs could not be refreshed.',
      });
  }


  checkOut() {
    if (this.checkingOut) return;
    if (!this.selectedTechnicianId || !this.selectedToolId || !this.selectedAssetTag || !this.dueDate) {
      this.validationMessage = 'Please fill all fields before checking out.';
      setTimeout(() => this.validationMessage = '', 4000);
      return;
    }

    const technician = this.technicians.find((t) => t._id.toString() === this.selectedTechnicianId);
    const tool = this.tools.find((t) => t._id === this.selectedToolId);

    const loanData = {
      toolId: tool._id,
      toolName: tool.name,
      assetTag: this.selectedAssetTag,
      technicianId: technician._id.toString(),
      technicianName: technician.name,
      dueDate: this.dueDate,
    };

    this.checkingOut = true;
    this.validationMessage = '';
    this.apiService.post('/inventory/asset-loans', loanData).subscribe({
      next: () => {
        this.checkingOut = false;
        this.fetchLoans();
        this.fetchAvailableTools();
        this.selectedToolId = '';
        this.selectedAssetTag = '';
        this.selectedTechnicianId = '';
        this.dueDate = '';
      },
      error: (err) => {
        this.checkingOut = false;
        this.validationMessage = err.error?.message || 'Failed to check out tool.';
      },
    });
  }

  openReturnModal(loan: ActiveLoan): void {
    this.activeReturnLoan = loan;
    this.returnCondition = this.returnConditions[loan._id!] || 'good';
    this.returnNotes = '';
    this.showReturnModal = true;
  }

  closeReturnModal(): void {
    if (this.activeReturnLoan && this.returningIds.has(this.activeReturnLoan._id!)) return;
    this.showReturnModal = false;
    this.activeReturnLoan = null;
    this.returnNotes = '';
  }

  confirmReturn(): void {
    if (!this.activeReturnLoan?._id) return;
    this.markReturned(this.activeReturnLoan._id, this.returnCondition, this.returnNotes);
  }

  markReturned(id: string, condition: ReturnCondition = this.returnConditions[id] || 'good', notes: string = '') {
    if (this.returningIds.has(id)) return;
    this.returningIds.add(id);
    const payload: { condition: ReturnCondition; notes?: string } = { condition };
    if (notes && notes.trim()) {
      payload.notes = notes.trim();
    }
    this.apiService.post(`/inventory/asset-loans/return/${id}`, payload).subscribe({
      next: () => {
        this.returningIds.delete(id);
        this.closeReturnModal();
        this.fetchLoans();
        this.fetchReturnLogs();
        this.fetchAvailableTools();
      },
      error: (err) => {
        this.returningIds.delete(id);
        this.validationMessage = err.error?.message || 'The tool could not be returned.';
      },
    });
  }

  private withLoanStatus(loans: ActiveLoan[]): ActiveLoan[] {
    return loans.map((loan) => ({
      ...loan,
      status: new Date(loan.dueDate) < new Date() ? 'Overdue' : 'On Time',
    }));
  }
}
