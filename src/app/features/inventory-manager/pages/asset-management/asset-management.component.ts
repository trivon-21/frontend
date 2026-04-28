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
}

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.css']
})
export class AssetManagementDashboardComponent implements OnInit {
  showModal = false;
  activeTab: 'loans' | 'logs' = 'loans';
  searchQuery: string = '';
  
  technicians: any[] = [];
  tools: any[] = [];
  loans: ActiveLoan[] = [];
  returnLogs: ReturnLog[] = [];

  // Form states
  selectedTechnicianId: string = '';
  selectedToolId: string = '';
  dueDate: string = '';

  setActiveTab(tab: 'loans' | 'logs') {
    this.activeTab = tab;
  }

  get filteredLoans() {
    const query = (this.searchQuery || '').toLowerCase().trim();
    if (!query) return this.loans;
    return this.loans.filter(l => 
      l.toolName?.toLowerCase().includes(query) || 
      l.assetTag?.toLowerCase().includes(query) ||
      l.technicianName?.toLowerCase().includes(query)
    );
  }

  get filteredReturnLogs() {
    const query = (this.searchQuery || '').toLowerCase().trim();
    if (!query) return this.returnLogs;
    return this.returnLogs.filter(l => 
      l.toolName?.toLowerCase().includes(query) || 
      l.assetTag?.toLowerCase().includes(query) ||
      l.technicianName?.toLowerCase().includes(query)
    );
  }

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.apiService.get('/inventory/technicians').subscribe(data => this.technicians = data);
    this.apiService.get('/inventory/list').subscribe(data => this.tools = data.filter((t: any) => t.isSerialized || t.category === 'Tools'));
    this.fetchLoans();
    this.fetchReturnLogs();
  }

  fetchLoans() {
    this.apiService.get('/inventory/asset-loans').subscribe(data => {
      this.loans = data.map((loan: any) => ({
        ...loan,
        status: new Date(loan.dueDate) < new Date() ? 'Overdue' : 'On Time'
      }));
    });
  }

  fetchReturnLogs() {
    this.apiService.get('/inventory/asset-return-logs').subscribe(data => this.returnLogs = data);
  }

  openRegisterModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  checkOut() {
    if (!this.selectedTechnicianId || !this.selectedToolId || !this.dueDate) {
      alert('Please fill all fields');
      return;
    }

    const technician = this.technicians.find(t => t._id.toString() === this.selectedTechnicianId);
    const tool = this.tools.find(t => t._id === this.selectedToolId);

    const loanData = {
      toolId: tool._id,
      toolName: tool.name,
      assetTag: tool.sku, // Using SKU as asset tag if not specific
      technicianId: technician._id.toString(),
      technicianName: technician.name,
      dueDate: this.dueDate
    };

    this.apiService.post('/inventory/asset-loans', loanData).subscribe(() => {
      this.fetchLoans();
      this.selectedToolId = '';
      this.selectedTechnicianId = '';
      this.dueDate = '';
    });
  }

  markReturned(id: string) {
    this.apiService.post(`/inventory/asset-loans/return/${id}`).subscribe(() => {
      this.fetchLoans();
      this.fetchReturnLogs();
    });
  }
}
