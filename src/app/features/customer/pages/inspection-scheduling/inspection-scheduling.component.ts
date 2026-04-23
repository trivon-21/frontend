import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InspectionTicketService } from '../../../finance/services/inspection-ticket.service';

interface CalendarDay {
  date:        string;
  label:       string;
  status:      'available' | 'unavailable' | 'holiday' | 'fully_booked';
  isSelected:  boolean;
  slotsLeft:   number;
  isWeekend:   boolean;
  isHoliday:   boolean;
  isFullyBooked: boolean;
}

@Component({
  selector: 'app-inspection-scheduling',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspection-scheduling.component.html',
  styleUrls: ['./inspection-scheduling.component.css']
})
export class InspectionSchedulingComponent implements OnInit {

  customerName  = 'Customer';
  ticketId      = '';
  mode          = 'scheduling'; // 'scheduling' or 'reschedule'
  selectedDay:  CalendarDay | null = null;
  isConfirmed   = false;
  isLoading     = true;
  isSubmitting  = false;
  loadError     = '';
  popupMessage  = '';
  showPopup     = false;
  currentScheduledDate: string = ''; // For reschedule mode

  startOffset:  any[] = [];
  weekDays      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  calendarDays: CalendarDay[] = [];

  constructor(
    private ticketService: InspectionTicketService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const ticketId = params['ticketId'];
      const mode = params['mode'];
      if (ticketId) {
        this.ticketId = ticketId;
        this.mode = mode || 'scheduling';
        this.loadCalendar(ticketId);
      } else {
        this.isLoading = false;
        this.loadError = 'No ticket ID provided.';
      }
    });
  }

  loadCalendar(ticketId: string): void {
    this.isLoading = true;
    this.ticketService.getAvailableDates(ticketId).subscribe({
      next: (data: any) => {
        // If already scheduled show confirmed state (but not if in reschedule mode)
        if (data.alreadyScheduled && this.mode !== 'reschedule') {
          this.isConfirmed = true;
          this.isLoading   = false;
          this.cdr.detectChanges();
          return;
        }

        // Store current scheduled date for reschedule mode
        if (data.alreadyScheduled && this.mode === 'reschedule') {
          this.currentScheduledDate = data.alreadyScheduled;
        }

        this.calendarDays = data.calendar.map((d: any) => ({
          date:          d.date,
          label:         this.formatLabel(d.date),
          status:        d.status,
          isSelected:    false,
          slotsLeft:     d.slotsLeft,
          isWeekend:     d.isWeekend,
          isHoliday:     d.isHoliday,
          isFullyBooked: d.isFullyBooked,
        }));

        // Calculate offset for first day
        if (this.calendarDays.length > 0) {
          const firstDate = new Date(this.calendarDays[0].date);
          const day       = firstDate.getDay();
          const offset    = day === 0 ? 6 : day - 1;
          this.startOffset = Array(offset).fill(0);
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load calendar:', err);
        this.loadError = err.message || 'Failed to load available dates.';
        this.isLoading = false;
      }
    });
  }

  formatLabel(dateStr: string): string {
    const date  = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day   = String(date.getDate()).padStart(2, '0');
    return `${month} ${day}`;
  }

  selectDay(day: CalendarDay) {
    if (day.status === 'unavailable') {
      this.showPopupMessage("Sorry, this day is not available for inspections.");
      return;
    }
    if (day.status === 'holiday') {
      this.showPopupMessage("🎉 This is a public holiday! Please choose another date.");
      return;
    }
    if (day.status === 'fully_booked') {
      this.showPopupMessage("😊 All inspection slots for this day are fully booked! Please choose another date.");
      return;
    }
    this.calendarDays.forEach(d => d.isSelected = false);
    day.isSelected = true;
    this.selectedDay = day;
    this.cdr.detectChanges();
  }

  showPopupMessage(msg: string) {
    this.popupMessage = msg;
    this.showPopup    = true;
    setTimeout(() => { this.showPopup = false; }, 3000);
  }

  get formattedSelectedDate(): string {
    if (!this.selectedDay) return '';
    const d      = new Date(this.selectedDay.date);
    const day    = d.getDate();
    const suffix = this.getOrdinal(day);
    const month  = d.toLocaleString('en-US', { month: 'long' });
    const year   = d.getFullYear();
    return `${day}${suffix} of ${month}, ${year}`;
  }

  get selectedWeekday(): string {
    if (!this.selectedDay) return '';
    return new Date(this.selectedDay.date).toLocaleString('en-US', { weekday: 'long' });
  }

  getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  confirm() {
    if (!this.selectedDay || !this.ticketId) return;
    this.isSubmitting = true;

    // Use reschedule endpoint if in reschedule mode, otherwise use confirmScheduling
    const serviceCall = this.mode === 'reschedule'
      ? this.ticketService.rescheduleInspection(this.ticketId, this.selectedDay.date)
      : this.ticketService.confirmScheduling(this.ticketId, this.selectedDay.date);

    serviceCall.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isConfirmed  = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.showPopupMessage(err.message || 'Failed to confirm. Please try again.');
        // Reload calendar in case slots changed
        this.loadCalendar(this.ticketId);
      }
    });
  }
}