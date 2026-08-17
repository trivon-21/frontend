import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionOfficerService } from '../../services/inspection-officer.service';

@Component({
  selector: 'app-inspection-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-dashboard.component.html',
  styleUrls: ['./inspection-dashboard.component.css']
})
export class InspectionDashboardComponent implements OnInit {

  searchQuery = '';
  selectedStatus = 'ALL';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  ongoingCount = 0;
  scheduledCount = 0;
  completedCount = 0;
  submittedCount = 0;

  allInspections: any[] = [];
  filteredInspections: any[] = [];
  paginatedInspections: any[] = [];

  constructor(private officerService: InspectionOfficerService) { }

  ngOnInit(): void { this.loadDashboard(); }

  loadDashboard(): void {
    this.officerService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.ongoingCount = data.ongoing || 0;
        this.scheduledCount = data.scheduled || 0;
        this.completedCount = data.completed || 0;
        this.submittedCount = data.submitted || 0;
        this.allInspections = data.tableData || [];
        this.applyFilters();
      },
      error: (err: any) => console.error('Dashboard load failed:', err)
    });
  }

  applyFilters() {
    this.filteredInspections = this.allInspections.filter(i => {
      const matchesSearch = this.searchQuery
        ? i.orderId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.ticketId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.customer?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      const matchesStatus = this.selectedStatus === 'ALL' || i.status === this.selectedStatus;
      const matchesDate = this.selectedDate
        ? new Date(i.date).toISOString().split('T')[0] === this.selectedDate
        : true;
      return matchesSearch && matchesStatus && matchesDate;
    });
    this.totalItems = this.filteredInspections.length;
    this.currentPage = 1;
    this.updatePaginated();
  }

  updatePaginated() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedInspections = this.filteredInspections.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }

  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) { this.currentPage++; this.updatePaginated(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.updatePaginated(); } }
  goToPage(p: number) { this.currentPage = p; this.updatePaginated(); }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ONGOING': return 'status-ongoing';
      case 'INSPECTION_SCHEDULED': return 'status-scheduled';
      case 'REPORT_RECORDED': return 'status-inspected';
      case 'INSPECTED': return 'status-inspected';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ONGOING': return 'Ongoing';
      case 'INSPECTION_SCHEDULED': return 'Scheduled';
      case 'REPORT_RECORDED': return 'Inspected';
      case 'INSPECTED': return 'Submitted';
      default: return status;
    }
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  shortId(id: any): string {
    if (!id) return '—';
    const value = id.toString();
    const suffix = value.includes('-') ? (value.split('-').pop() || value) : value;
    return suffix.slice(-6).toUpperCase();
  }
}