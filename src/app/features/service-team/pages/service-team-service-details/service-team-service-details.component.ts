import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-service-team-service-details',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalIconsModule],
  templateUrl: './service-team-service-details.component.html',
  styleUrl: './service-team-service-details.component.css'
})
export class ServiceTeamServiceDetailsComponent implements OnInit {
  ticket: any;
  ticketId: string | null = null;
  actionTaken = false;
  isLoading = false;
  isUpdatingStatus = false;
  isSubmittingReport = false;
  loadError = '';
  statusUpdateError = '';
  statusUpdateSuccess = '';
  reportSubmitError = '';
  reportSubmitSuccess = '';
  showAdditionalService = false;
  isSubmittingAdditionalService = false;
  additionalServiceError = '';
  additionalServiceSuccess = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService
  ) { }

  ngOnInit() {
    this.ticketId = this.route.snapshot.paramMap.get('id');
    if (this.ticketId) {
      this.loadTicket();
    }
  }

  loadTicket(): void {
    if (!this.ticketId) return;
    this.isLoading = true;
    this.loadError = '';

    this.taskService.getTaskById(this.ticketId).subscribe({
      next: (data) => {
        this.ticket = data;
        this.actionTaken = false;
        this.isLoading = false;
      },
      error: () => {
        this.ticket = null;
        this.loadError = 'Unable to load ticket details right now.';
        this.isLoading = false;
      }
    });
  }

  navigateToLocation(): void {
    if (!this.ticket) {
      console.error('Ticket data not available');
      return;
    }

    const address = this.ticket?.customer?.address || this.ticket?.location || 'Unknown';
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
    window.open(mapsUrl, '_blank');
  }

  updateTicketStatus(newStatus: string): void {
    const recordId = this.ticket?.sourceId || this.ticket?._id || this.ticket?.id || this.ticketId;
    if (!recordId || this.isUpdatingStatus) return;

    this.isUpdatingStatus = true;
    this.statusUpdateError = '';
    this.statusUpdateSuccess = '';
    const normalizedStatus = this.normalizeStatus(newStatus);

    this.taskService.updateTaskStatus(String(recordId), normalizedStatus).subscribe({
      next: (res) => {
        if (this.ticket) {
          this.ticket['status'] = (res as any)?.status || normalizedStatus;
        }
        this.statusUpdateSuccess = `Status updated to ${this.ticket?.['status']}.`;
        // Removed this.loadTicket() so we don't accidentally revert the status
        console.log('Ticket status updated to:', this.ticket?.['status']);
      },
      error: (err) => {
        this.statusUpdateError = err?.error?.message || 'Failed to update ticket status. Please try again.';
        console.error('Failed to update ticket status:', err);
      },
      complete: () => {
        this.isUpdatingStatus = false;
      }
    });
  }

  private normalizeStatus(status: string): string {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'service in progress') return 'In Progress';
    if (normalized === 'on hold') return 'On Hold';
    if (normalized === 'completed') return 'Completed';
    return status;
  }

  statusClass(status: string): string {
    return String(status || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  }

  get baseRoute(): string {
    const url = decodeURIComponent(this.router.url);
    if (url.includes('/service-team-a') || url.includes('/service team a')) return '/service-team-a';
    if (url.includes('/service-team-b') || url.includes('/service team b')) return '/service-team-b';
    return '/service-team';
  }

  viewServiceHistory(): void {
    if (this.ticketId) {
      const type = (this.ticket?.type || '').toLowerCase();
      let source = 'service';
      if (type === 'installation') source = 'installation';
      else if (type === 'maintenance') source = 'maintenance';
      
      this.router.navigate([this.baseRoute + '/service-history', this.ticketId], { queryParams: { source } });
    }
  }

  cancelNote(noteInput: HTMLTextAreaElement): void {
    noteInput.value = '';
  }

  submitNote(noteInput: HTMLTextAreaElement): void {
    const note = noteInput.value.trim();
    if (!note) {
      return;
    }

    console.log('Note submitted:', note);
    noteInput.value = '';
  }

  submitReport(noteInput: HTMLTextAreaElement): void {
    if (!this.ticket || this.isSubmittingReport) {
      return;
    }

    const note = noteInput.value.trim();
    if (!note) {
      this.reportSubmitSuccess = '';
      this.reportSubmitError = 'Please add a note before submitting the service report.';
      return;
    }

    this.isSubmittingReport = true;
    this.reportSubmitError = '';
    this.reportSubmitSuccess = '';

    const recordId = this.ticket.sourceId || this.ticket._id || this.ticket.id;

    // Derive onModel from the ticket type returned by the backend.
    // Backend formatTask() returns: 'Installation', 'Maintenance', or 'Service Request'.
    let onModel: string;
    if (this.ticket.type === 'Installation') {
      onModel = 'Installation';
    } else if (this.ticket.type === 'Maintenance') {
      onModel = 'Maintenance';
    } else {
      onModel = 'ServiceRequest';
    }

    // Send a clean, explicit payload — do NOT spread the whole ticket object as
    // that can overwrite backend-derived fields and send unexpected properties.
    const payload = {
      serviceRequestId: recordId,
      onModel,
      teamName: this.ticket.teamName || '',
      serviceType: this.ticket.serviceType || '',
      customer: this.ticket.customer || {},
      location: this.ticket.location || '',
      scheduledDate: this.ticket.scheduledDate || null,
      productDetails: {
        generalType: this.ticket.serviceType || '',
        detailedType: this.ticket.detailedProductType || this.ticket.serviceType || '',
        description: this.ticket.description || '',
      },
      materialsUsed: Array.isArray(this.ticket.materials) ? this.ticket.materials : [],
      notesFromMainTechnician: note,
      technicianComment: note,
    };

    this.taskService.submitReport(payload).subscribe({
      next: () => {
        this.reportSubmitSuccess = 'Service report submitted.';
        noteInput.value = '';
      },
      error: (err) => {
        this.reportSubmitError = err?.error?.message || 'Failed to submit service report.';
        this.isSubmittingReport = false;
      },
      complete: () => {
        this.isSubmittingReport = false;
      }
    });
  }

  toggleAdditionalService(): void {
    this.showAdditionalService = !this.showAdditionalService;
    this.additionalServiceError = '';
    this.additionalServiceSuccess = '';
  }

  submitAdditionalService(descInput: HTMLTextAreaElement): void {
    if (!this.ticket || this.isSubmittingAdditionalService) {
      return;
    }

    const desc = descInput.value.trim();
    if (!desc) {
      this.additionalServiceSuccess = '';
      this.additionalServiceError = 'Please provide a description.';
      return;
    }

    this.isSubmittingAdditionalService = true;
    this.additionalServiceError = '';
    this.additionalServiceSuccess = '';

    const recordId = this.ticket.sourceId || this.ticket._id || this.ticket.id;

    this.taskService.addAdditionalService(String(recordId), desc).subscribe({
      next: () => {
        this.additionalServiceSuccess = 'Additional service added successfully.';
        descInput.value = '';
        this.showAdditionalService = false;
      },
      error: (err) => {
        this.additionalServiceError = err?.error?.message || 'Failed to add additional service.';
        this.isSubmittingAdditionalService = false;
      },
      complete: () => {
        this.isSubmittingAdditionalService = false;
      }
    });
  }
}

