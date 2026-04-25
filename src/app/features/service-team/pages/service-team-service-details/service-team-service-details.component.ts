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
      '238489782': {
        id: '238489782',
        type: 'Service Request',
        status: 'Assigned',
        customer: {
          name: 'John Anderson',
          phone: '+94 77 253 5432',
          email: 'john.anderson@gmail.com',
          address: 'No.45, Galle Road, Colombo 03, Sri Lanka'
        },
        location: 'Logistic Area 1',
        scheduledDate: '2026-03-10',
        serviceType: 'Split AC - 3 Units',
        detailedProductType: 'Daikin Split AC 12,000 BTU (Inverter)',
        description: 'Water has been leaking from the outside unit and cooling process is not properly happening.',
        notesFromTechnician: 'Please check the north wing units first as they have priority.',
        materials: [
          { item: 'Copper piping (3/8" + 5/8")', quantity: '45 meters' },
          { item: 'Electrical cable (3-core, 4mm²)', quantity: '60 meters' },
          { item: 'Wall mounting brackets (heavy duty)', quantity: '6 units' },
          { item: 'Drainage PVC pipes & fittings', quantity: '30 meters' }
        ]
      },
      '238489783': {
        id: '238489783',
        type: 'Installation',
        status: 'In Progress',
        customer: {
          name: 'Nimal Perera',
          phone: '+94 71 445 7788',
          email: 'nimal.perera@gmail.com',
          address: 'Galle Road, Colombo 03, Sri Lanka'
        },
        location: 'Galle Road, Colombo 03',
        scheduledDate: '2026-04-10',
        serviceType: 'Cassette AC - 2 Units',
        detailedProductType: 'Mitsubishi Cassette AC 18,000 BTU',
        description: 'New installation required for two indoor cassette units with outdoor compressor alignment.',
        notesFromTechnician: 'Confirm ceiling support before drilling and run cable trays via west corridor.',
        materials: [
          { item: 'Cassette mounting kit', quantity: '2 units' },
          { item: 'Electrical cable (4-core, 4mm²)', quantity: '50 meters' },
          { item: 'PVC drain pipes', quantity: '25 meters' },
          { item: 'Copper tubing set', quantity: '40 meters' }
        ]
      },
      '238489784': {
        id: '238489784',
        type: 'Service Request',
        status: 'On Hold',
        customer: {
          name: 'Kavindi Silva',
          phone: '+94 76 333 2211',
          email: 'kavindi.silva@gmail.com',
          address: 'Malabe Tech Park, Sri Lanka'
        },
        location: 'Malabe Tech Park',
        scheduledDate: '2026-04-11',
        serviceType: 'Ducted AC - 1 Unit',
        detailedProductType: 'Carrier Ducted AC 24,000 BTU',
        description: 'Intermittent cooling reported and occasional compressor shutdown after 20 minutes.',
        notesFromTechnician: 'Awaiting spare control board confirmation from warehouse.',
        materials: [
          { item: 'Control board module', quantity: '1 unit' },
          { item: 'Capacitor set', quantity: '2 units' }
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
    if (!this.ticketId || this.isUpdatingStatus) return;

    this.isUpdatingStatus = true;
    this.statusUpdateError = '';
    this.statusUpdateSuccess = '';
    const normalizedStatus = this.normalizeStatus(newStatus);

    this.taskService.updateTaskStatus(this.ticketId, normalizedStatus).subscribe({
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

