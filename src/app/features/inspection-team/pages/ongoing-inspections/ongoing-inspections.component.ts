import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InspectionOfficerService } from '../../services/inspection-officer.service';

@Component({
  selector: 'app-ongoing-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ongoing-inspections.component.html',
  styleUrls: ['./ongoing-inspections.component.css']
})
export class OngoingInspectionsComponent implements OnInit {

  inspections: any[] = [];
  filteredInspections: any[] = [];
  searchQuery = '';
  selectedFilter = 'All';
  selectedDate = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;
  isLoading = false;

  constructor(
    private officerService: InspectionOfficerService,
    private router: Router
  ) { }

  ngOnInit(): void { this.loadInspections(); }

  loadInspections(): void {
    this.isLoading = true;
    this.officerService.getOngoingInspections().subscribe({
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

  recordInspection(inspection: any): void {
    this.router.navigate(['/inspection-report'], {
      queryParams: {
        ticketId: inspection._id,
        customerName: inspection.prefill?.customerName || '',
        contactNumber: inspection.prefill?.contactNumber || '',
        siteAddress: inspection.prefill?.siteAddress || '',
        inspectionDate: inspection.prefill?.inspectionDate || '',
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
  }

  shortId(id: any): string {
    if (!id) return '—';
    const value = id.toString();
    const suffix = value.includes('-') ? (value.split('-').pop() || value) : value;
    return suffix.slice(-6).toUpperCase();
  }
}