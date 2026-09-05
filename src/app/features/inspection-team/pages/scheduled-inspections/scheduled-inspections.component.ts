import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InspectionOfficerService } from '../../services/inspection-officer.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-scheduled-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scheduled-inspections.component.html',
  styleUrls: ['./scheduled-inspections.component.css']
})
export class ScheduledInspectionsComponent implements OnInit {

  inspections: any[] = [];
  searchQuery = '';
  selectedInspection: any = null;
  showDetailsModal = false;
  showArrivalModal = false;
  arrivalTime = '';
  isLoading = false;
  startingTicketId = '';

  constructor(
    private officerService: InspectionOfficerService,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void { this.loadInspections(); }

  loadInspections(): void {
    this.isLoading = true;
    this.officerService.getScheduledInspections().subscribe({
      next: (data: any[]) => { this.inspections = data; this.isLoading = false; },
      error: (err: any) => { console.error(err); this.isLoading = false; }
    });
  }

  get filteredInspections() {
    if (!this.searchQuery.trim()) return this.inspections;
    const q = this.searchQuery.toLowerCase();
    return this.inspections.filter(i =>
      i.orderId?.toLowerCase().includes(q) ||
      i.ticketId?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q)
    );
  }

  openDetails(inspection: any) { this.selectedInspection = inspection; this.showDetailsModal = true; }
  closeDetailsModal() { this.showDetailsModal = false; this.selectedInspection = null; }

  openArrivalModal(inspection: any) {
    this.startingTicketId = inspection._id;
    this.selectedInspection = inspection;
    this.arrivalTime = '';
    this.showArrivalModal = true;
  }

  closeArrivalModal() { this.showArrivalModal = false; this.arrivalTime = ''; }

  confirmStartInspection(): void {
    if (!this.arrivalTime.trim()) { this.notificationService.show('Please enter arrival time.', 'warning'); return; }
    this.isLoading = true;

    // Record which inspector started this job, sourced from the authenticated user
    const currentUser = this.authService.getCurrentUser();
    const inspectorId = currentUser?.id;

    this.officerService.startInspection(this.startingTicketId, this.arrivalTime, inspectorId).subscribe({
      next: () => {
        this.notificationService.show('Inspection started! Arrival time email sent to customer.', 'success');
        this.closeArrivalModal();
        this.loadInspections();
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.notificationService.show('Failed to start inspection.', 'error');
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