import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-service-team-service-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
        const fallback = this.getFallbackTicket(this.ticketId as string);
        if (fallback) {
          this.ticket = fallback;
          this.loadError = '';
        } else {
          this.ticket = null;
          this.loadError = 'Unable to load ticket details right now.';
        }
        this.isLoading = false;
      }
    });
  }

  private getFallbackTicket(id: string): any | null {
    const fallbackTickets: Record<string, any> = {
    };

    return fallbackTickets[id] || null;
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
        this.loadTicket();
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

  viewServiceHistory(): void {
    if (this.ticketId) {
      this.router.navigate(['/service-team/service-history', this.ticketId]);
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

    const payload = {
      ...this.ticket,
      _id: this.ticket.sourceId || this.ticket._id || this.ticket.id,
      serviceRequestId: this.ticket.sourceId || this.ticket._id || this.ticket.id,
      onModel: this.ticket.type === 'Installation' ? 'Installation' : 'ServiceRequest',
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
}

