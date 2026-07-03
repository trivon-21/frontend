import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  TicketsService,
  Ticket,
  TicketSummary,
  TicketStatus,
} from '../../services/tickets.service';

interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
})
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  summary: TicketSummary = { total: 0, open: 0, inProgress: 0, escalated: 0, resolved: 0 };
  status = 'Syncing…';
  loading = false;
  updatingId: string | null = null;

  statusFilters: FilterChip[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'escalated', label: 'Escalated' },
    { key: 'resolved', label: 'Resolved' },
  ];
  priorityFilters: FilterChip[] = [
    { key: 'all', label: 'All' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];
  activeStatus = 'all';
  activePriority = 'all';

  constructor(private ticketsService: TicketsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.ticketsService
      .getTickets({ status: this.activeStatus, priority: this.activePriority })
      .subscribe({
        next: (res) => {
          this.tickets = res.tickets;
          this.summary = res.summary;
          this.status = res.status;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  setStatus(key: string): void {
    this.activeStatus = key;
    this.load();
  }

  setPriority(key: string): void {
    this.activePriority = key;
    this.load();
  }

  // ── Row actions (optimistic) ──

  assign(ticket: Ticket): void {
    const name = window.prompt(`Assign ${ticket.ticketId} to technician:`, ticket.assignedTo || '');
    if (name === null) return;
    const trimmed = name.trim();
    this.patch(ticket, {
      assignedTo: trimmed,
      status: trimmed && ticket.status === 'open' ? 'in-progress' : ticket.status,
    });
  }

  escalate(ticket: Ticket): void {
    this.patch(ticket, { status: 'escalated' });
  }

  resolve(ticket: Ticket): void {
    this.patch(ticket, { status: 'resolved' });
  }

  private patch(ticket: Ticket, changes: Partial<Ticket>): void {
    const previous = { ...ticket };
    Object.assign(ticket, changes);
    this.recomputeSummary();
    this.updatingId = ticket._id;

    this.ticketsService.updateTicket(ticket._id, changes).subscribe({
      next: (updated) => {
        this.updatingId = null;
        // If the server rejected (null) while online, roll back the optimistic change.
        if (!updated && this.status !== 'Offline') {
          Object.assign(ticket, previous);
          this.recomputeSummary();
        }
      },
      error: () => {
        this.updatingId = null;
        Object.assign(ticket, previous);
        this.recomputeSummary();
      },
    });
  }

  private recomputeSummary(): void {
    this.summary = {
      total: this.tickets.length,
      open: this.tickets.filter((t) => t.status === 'open').length,
      inProgress: this.tickets.filter((t) => t.status === 'in-progress').length,
      escalated: this.tickets.filter((t) => t.status === 'escalated').length,
      resolved: this.tickets.filter((t) => t.status === 'resolved').length,
    };
  }

  // ── View helpers ──

  statusLabel(status: TicketStatus): string {
    return status === 'in-progress'
      ? 'In Progress'
      : status.charAt(0).toUpperCase() + status.slice(1);
  }

  slaText(ticket: Ticket): string {
    if (!ticket.slaDueAt) return '—';
    const due = new Date(ticket.slaDueAt).getTime();
    const diff = due - Date.now();
    if (ticket.status === 'resolved') return 'Met';
    if (diff <= 0) return 'Overdue';
    const hours = Math.round(diff / (3600 * 1000));
    if (hours < 24) return `${hours}h left`;
    return `${Math.round(hours / 24)}d left`;
  }

  slaOverdue(ticket: Ticket): boolean {
    if (!ticket.slaDueAt || ticket.status === 'resolved') return false;
    return new Date(ticket.slaDueAt).getTime() - Date.now() <= 0;
  }
}
