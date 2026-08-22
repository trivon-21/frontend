import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

interface ActiveLoan {
  _id?: string;
  id?: string;
  toolId: string;
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

import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
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
    this.apiService.get('/inventory/technicians').subscribe((data) => (this.technicians = data));
    this.fetchAvailableTools();
    this.fetchLoans();
    this.fetchReturnLogs();
  }

  fetchAvailableTools() {
    this.apiService.get('/inventory/available-tools').subscribe((data) => (this.tools = data));
  }

  get selectedToolAssetTags(): string[] {
    return this.tools.find((tool) => tool._id === this.selectedToolId)?.availableSerialNumbers || [];
  }

  onToolSelected(): void {
    this.selectedAssetTag = '';
  }

  fetchLoans() {
    this.apiService.get('/inventory/asset-loans').subscribe((data) => {
      this.loans = data.map((loan: any) => ({
        ...loan,
        status: new Date(loan.dueDate) < new Date() ? 'Overdue' : 'On Time',
      }));
    });
  }

  fetchReturnLogs() {
    this.apiService
      .get('/inventory/asset-return-logs')
      .subscribe((data) => (this.returnLogs = data));
  }


  checkOut() {
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

    this.apiService.post('/inventory/asset-loans', loanData).subscribe({
      next: () => {
        this.fetchLoans();
        this.fetchAvailableTools();
        this.selectedToolId = '';
        this.selectedAssetTag = '';
        this.selectedTechnicianId = '';
        this.dueDate = '';
      },
      error: (err) => {
        this.validationMessage = err.error?.message || 'Failed to check out tool.';
      },
    });
  }

  markReturned(id: string) {
    this.apiService.post(`/inventory/asset-loans/return/${id}`).subscribe(() => {
      this.fetchLoans();
      this.fetchReturnLogs();
      this.fetchAvailableTools();
    });
  }
}
