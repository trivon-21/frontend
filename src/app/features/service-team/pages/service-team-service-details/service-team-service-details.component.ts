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
      '238489782': {
        id: '238489782',
        sourceId: '238489782',
        type: 'Service Request',
        status: 'Assigned',
        customer: {
          name: 'John Anderson',
          address: 'Logistic Area 1, Colombo',
          phone: '+94 77 123 4567',
          email: 'john.anderson@logistic.lk'
        },
        location: 'Logistic Area 1, Colombo',
        scheduledDate: new Date().toISOString(),
        serviceType: 'Split AC - 3 Units',
        detailedProductType: 'Split Air Conditioner (Inverter)',
        description: 'Air Conditioner unit making strange noise and failing to cool the server room.',
        notesFromTechnician: 'Inspect fan blade alignment and compressor power draw.',
        materials: [
          { item: 'Copper piping (3/8" + 5/8")', quantity: '15 meters' },
          { item: 'Compressor capacitor (45uF)', quantity: '1 unit' }
        ]
      },
      '238489783': {
        id: '238489783',
        sourceId: '238489783',
        type: 'Installation',
        status: 'In Progress',
        customer: {
          name: 'Nimal Perera',
          address: 'Galle Road, Colombo 03',
          phone: '+94 77 234 5678',
          email: 'nimal.p@gmail.com'
        },
        location: 'Galle Road, Colombo 03',
        scheduledDate: new Date().toISOString(),
        serviceType: 'Cassette AC - 2 Units',
        detailedProductType: 'Cassette Air Conditioner',
        description: 'Standard installation of two Cassette units in the main lobby.',
        notesFromTechnician: 'Requires scaffold tower for high ceiling mounting.',
        materials: [
          { item: 'Wall mounting brackets (heavy duty)', quantity: '2 units' },
          { item: 'Drainage PVC pipes & fittings', quantity: '10 meters' }
        ]
      },
      '238489784': {
        id: '238489784',
        sourceId: '238489784',
        type: 'Service Request',
        status: 'On Hold',
        customer: {
          name: 'Kavindi Silva',
          address: 'Malabe Tech Park, Malabe',
          phone: '+94 77 345 6789',
          email: 'kavindi@techpark.lk'
        },
        location: 'Malabe Tech Park, Malabe',
        scheduledDate: new Date().toISOString(),
        serviceType: 'Ducted AC - 1 Unit',
        detailedProductType: 'Ducted Air Conditioner',
        description: 'Water leak from the ceiling unit in Section 4.',
        notesFromTechnician: 'Wait for ceiling tiles to be removed by facility manager.',
        materials: [
          { item: 'PVC insulation tape', quantity: '2 rolls' }
        ]
      }
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

    // Intercept fallback tickets for local preview
    if (['238489782', '238489783', '238489784'].includes(String(recordId))) {
      setTimeout(() => {
        if (this.ticket) {
          this.ticket.status = normalizedStatus;
        }
        this.statusUpdateSuccess = `Status updated to ${normalizedStatus}.`;
        this.isUpdatingStatus = false;
      }, 500);
      return;
    }

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

  get baseRoute(): string {
    if (this.router.url.includes('/service-team-a')) return '/service-team-a';
    if (this.router.url.includes('/service-team-b')) return '/service-team-b';
    return '/service-team';
  }

  viewServiceHistory(): void {
    if (this.ticketId) {
      this.router.navigate([this.baseRoute + '/service-history', this.ticketId]);
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
    
    // Intercept fallback tickets for local preview
    if (['238489782', '238489783', '238489784'].includes(String(recordId))) {
      setTimeout(() => {
        this.reportSubmitSuccess = 'Service report submitted (Local Preview).';
        noteInput.value = '';
        this.isSubmittingReport = false;
      }, 500);
      return;
    }

    const payload = {
      ...this.ticket,
      _id: recordId,
      serviceRequestId: recordId,
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

    // Intercept fallback tickets for local preview
    if (['238489782', '238489783', '238489784'].includes(String(recordId))) {
      setTimeout(() => {
        this.additionalServiceSuccess = 'Additional service added (Local Preview).';
        descInput.value = '';
        this.isSubmittingAdditionalService = false;
        this.showAdditionalService = false;
      }, 500);
      return;
    }

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

