import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Technician, Ticket, TicketStatus, TicketSummary, TicketUpdate, TicketsService } from '../../services/tickets.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
})
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  technicians: Technician[] = [];
  selectedTicket: Ticket | null = null;
  selectedTechnicianId = '';
  summary: TicketSummary = { total: 0, open: 0, inProgress: 0, escalated: 0, resolved: 0 };
  status = 'Syncing…';
  loading = false;
  updatingId: string | null = null;
  errorMessage = '';
  readonly statusFilters = ['all', 'open', 'in-progress', 'escalated', 'resolved'];
  readonly priorityFilters = ['all', 'high', 'medium', 'low'];
  activeStatus = 'all';
  activePriority = 'all';

  constructor(private ticketsService: TicketsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status');
      const priority = params.get('priority');
      if (status && this.statusFilters.includes(status)) this.activeStatus = status;
      if (priority && this.priorityFilters.includes(priority)) this.activePriority = priority;
      this.load();
    });
    this.ticketsService.getTechnicians().subscribe((technicians) => this.technicians = technicians);
  }

  load(): void {
    this.loading = true;
    this.ticketsService.getTickets({ status: this.activeStatus, priority: this.activePriority }).subscribe((response) => {
      this.tickets = response.tickets;
      this.summary = response.summary;
      this.status = response.status;
      this.loading = false;
    });
  }

  setStatus(status: string): void { this.activeStatus = status; this.load(); }
  setPriority(priority: string): void { this.activePriority = priority; this.load(); }

  openDetails(ticket: Ticket): void {
    this.selectedTicket = ticket;
    const assigned = ticket.assignedTechnicianId;
    this.selectedTechnicianId = typeof assigned === 'object' ? assigned._id : assigned || '';
    this.errorMessage = '';
  }

  closeDetails(): void { this.selectedTicket = null; }

  assignSelected(): void {
    if (!this.selectedTicket || !this.selectedTechnicianId) return;
    this.patch(this.selectedTicket, { assignedTechnicianId: this.selectedTechnicianId });
  }

  escalate(ticket: Ticket): void { this.patch(ticket, { status: 'escalated' }); }
  resolve(ticket: Ticket): void { this.patch(ticket, { status: 'resolved' }); }
  reopen(ticket: Ticket): void { this.patch(ticket, { status: 'open' }); }

  customer(ticket: Ticket): SafeCustomer | null {
    return typeof ticket.customerId === 'object' ? ticket.customerId : null;
  }

  private patch(ticket: Ticket, changes: TicketUpdate): void {
    this.updatingId = ticket._id;
    this.errorMessage = '';
    this.ticketsService.updateTicket(ticket._id, changes).subscribe({
      next: (updated) => {
        const index = this.tickets.findIndex((item) => item._id === updated._id);
        if (index >= 0) this.tickets[index] = updated;
        if (this.selectedTicket?._id === updated._id) this.openDetails(updated);
        this.updatingId = null;
        this.load();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Ticket update failed.';
        this.updatingId = null;
      },
    });
  }

  statusLabel(status: TicketStatus): string {
    return status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
  }

  filterLabel(value: string): string {
    return value === 'in-progress' ? 'In Progress' : value.charAt(0).toUpperCase() + value.slice(1);
  }

  slaText(ticket: Ticket): string {
    if (!ticket.slaDueAt) return '—';
    if (ticket.status === 'resolved') return 'Met';
    const hours = Math.ceil((new Date(ticket.slaDueAt).getTime() - Date.now()) / 3600000);
    if (hours <= 0) return 'Overdue';
    return hours < 24 ? `${hours}h left` : `${Math.ceil(hours / 24)}d left`;
  }

  slaOverdue(ticket: Ticket): boolean {
    return Boolean(ticket.slaDueAt && ticket.status !== 'resolved' && new Date(ticket.slaDueAt).getTime() <= Date.now());
  }
}

interface SafeCustomer {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
}
