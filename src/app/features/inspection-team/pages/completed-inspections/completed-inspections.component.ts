import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionOfficerService } from '../../services/inspection-officer.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';

@Component({
  selector: 'app-completed-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './completed-inspections.component.html',
  styleUrls: ['./completed-inspections.component.css']
})
export class CompletedInspectionsComponent implements OnInit {

  inspections: any[] = [];
  filteredInspections: any[] = [];
  selectedInspection: any = null;
  showReportModal = false;
  reportData: any = null;
  isEditing = false;
  editedReport: any = null;
  isLoading = false;
  isSubmitting = false;

  searchQuery = '';
  selectedFilter = 'All';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  constructor(
    private officerService: InspectionOfficerService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void { this.loadInspections(); }

  loadInspections(): void {
    this.isLoading = true;
    this.officerService.getCompletedInspections().subscribe({
      next: (data: any[]) => {
        this.inspections = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => { console.error(err); this.isLoading = false; }
    });
  }

  applyFilters() {
    this.filteredInspections = this.inspections.filter(i => {
      const matchesSearch = this.searchQuery
        ? i.orderId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.ticketId?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;
      const matchesDate = this.selectedDate
        ? new Date(i.inspectionDate).toDateString() === new Date(this.selectedDate).toDateString()
        : true;
      return matchesSearch && matchesDate;
    });
    this.totalItems = this.filteredInspections.length;
    this.currentPage = 1;
  }

  get paginatedInspections() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInspections.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number[] {
    return Array.from({ length: Math.ceil(this.totalItems / this.itemsPerPage) }, (_, i) => i + 1);
  }

  get startItem() { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1; }
  get endItem() { return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); }
  nextPage() { if (this.currentPage * this.itemsPerPage < this.totalItems) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  goToPage(page: number) { this.currentPage = page; }

  viewReport(inspection: any): void {
    this.selectedInspection = inspection;
    this.isEditing = false;
    this.isLoading = true;
    this.officerService.getReport(inspection._id).subscribe({
      next: (data: any) => {
        this.reportData = data;
        this.editedReport = JSON.parse(JSON.stringify(data));
        this.showReportModal = true;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.notificationService.show('❌ Failed to load report.', 'error');
      }
    });
  }

  closeModal(): void {
    this.showReportModal = false;
    this.selectedInspection = null;
    this.reportData = null;
    this.isEditing = false;
  }

  startEditing(): void { this.isEditing = true; }

  saveEdit(): void {
    this.isLoading = true;
    this.officerService.saveReport(this.selectedInspection._id, this.editedReport).subscribe({
      next: () => {
        this.reportData = JSON.parse(JSON.stringify(this.editedReport));
        this.isEditing = false;
        this.isLoading = false;
        this.notificationService.show('✅ Report updated successfully!', 'success');
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.notificationService.show('❌ Failed to save changes.', 'error');
      }
    });
  }

  async submitToTechnician(inspection: any): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Submit Report',
      message: 'Submit this report to the Main Technician?',
      confirmText: 'Submit',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    this.isSubmitting = true;
    this.officerService.submitReport(inspection._id).subscribe({
      next: () => {
        this.notificationService.show('✅ Report submitted to Main Technician via email!', 'success');
        this.closeModal();
        this.loadInspections();
        this.isSubmitting = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isSubmitting = false;
        this.notificationService.show('❌ Failed to submit report.', 'error');
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
  }
}