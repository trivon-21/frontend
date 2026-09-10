import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

interface CalendarDay {
  iso: string;
  label: number;
  inMonth: boolean;
  disabled: boolean;
  isToday: boolean;
}

const ITEM_HEIGHT = 36;
const WHEEL_PAD_ROWS = 2;
const WHEEL_REPEAT = 9;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'app-datetime-picker',
  standalone: true,
  imports: [CommonModule, PortalIconsModule],
  templateUrl: './datetime-picker.component.html',
  styleUrls: ['./datetime-picker.component.css'],
})
export class DatetimePickerComponent implements OnChanges {
  @Input() label = 'Select date & time';
  @Input() placeholder = 'Choose return date & time';
  @Input() date = '';
  @Input() time = '';
  @Input() minDate: string | null = null;

  @Output() dateChange = new EventEmitter<string>();
  @Output() timeChange = new EventEmitter<string>();

  @ViewChild('hourWheel') hourWheelRef?: ElementRef<HTMLDivElement>;
  @ViewChild('minuteWheel') minuteWheelRef?: ElementRef<HTMLDivElement>;

  readonly weekdays = WEEKDAY_NAMES;
  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  readonly hourItems = Array.from({ length: this.hours.length * WHEEL_REPEAT }, (_, i) => this.hours[i % this.hours.length]);
  readonly minuteItems = Array.from({ length: this.minutes.length * WHEEL_REPEAT }, (_, i) => this.minutes[i % this.minutes.length]);

  open = false;
  viewYear = 0;
  viewMonth = 0;
  calendarDays: CalendarDay[] = [];

  draftDate = '';
  draftHour = 17;
  draftMinute = 0;

  private hourScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private minuteScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private hourRecenterTimer: ReturnType<typeof setTimeout> | null = null;
  private minuteRecenterTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['date'] || changes['time']) {
      this.syncDraftFromInputs();
    }
  }

  get effectiveMinDate(): string {
    return this.minDate ?? this.todayIso();
  }

  get monthLabel(): string {
    return `${MONTH_NAMES[this.viewMonth]} ${this.viewYear}`;
  }

  get triggerLabel(): string {
    if (!this.date || !this.time) {
      return this.placeholder;
    }
    return `${this.formatDatePretty(this.date)} · ${this.time}`;
  }

  get summaryLabel(): string {
    if (!this.draftDate) {
      return 'Pick a date to continue';
    }
    return `Scheduled for ${this.formatDatePretty(this.draftDate)} at ${this.pad(this.draftHour)}:${this.pad(this.draftMinute)}`;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.open) {
      this.open = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open = false;
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.open) {
      this.open = false;
      return;
    }
    this.syncDraftFromInputs();
    const [y, m] = this.parseIso(this.draftDate || this.effectiveMinDate);
    this.viewYear = y;
    this.viewMonth = m;
    this.buildCalendarDays();
    this.open = true;
    setTimeout(() => this.scrollWheelsToSelection(), 0);
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  prevMonth(): void {
    this.viewMonth -= 1;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear -= 1;
    }
    this.buildCalendarDays();
  }

  nextMonth(): void {
    this.viewMonth += 1;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear += 1;
    }
    this.buildCalendarDays();
  }

  selectDay(day: CalendarDay): void {
    if (day.disabled) {
      return;
    }
    this.draftDate = day.iso;
    const [y, m] = this.parseIso(day.iso);
    if (y !== this.viewYear || m !== this.viewMonth) {
      this.viewYear = y;
      this.viewMonth = m;
      this.buildCalendarDays();
    } else {
      this.buildCalendarDays();
    }
  }

  pickHour(h: number): void {
    const ref = this.hourWheelRef;
    const currentIndex = Math.round((ref?.nativeElement.scrollTop ?? 0) / ITEM_HEIGHT);
    const index = this.nearestIndexForValue(this.hours, h, currentIndex);
    this.draftHour = h;
    this.scrollWheelToIndex(ref, index);
    this.scheduleRecenter('hour', ref, index);
  }

  pickMinute(m: number): void {
    const ref = this.minuteWheelRef;
    const currentIndex = Math.round((ref?.nativeElement.scrollTop ?? 0) / ITEM_HEIGHT);
    const index = this.nearestIndexForValue(this.minutes, m, currentIndex);
    this.draftMinute = m;
    this.scrollWheelToIndex(ref, index);
    this.scheduleRecenter('minute', ref, index);
  }

  onWheelScroll(kind: 'hour' | 'minute'): void {
    const ref = kind === 'hour' ? this.hourWheelRef : this.minuteWheelRef;
    const debounceField = kind === 'hour' ? 'hourScrollTimer' : 'minuteScrollTimer';
    const recenterField = kind === 'hour' ? 'hourRecenterTimer' : 'minuteRecenterTimer';
    if (this[recenterField]) {
      clearTimeout(this[recenterField]!);
      this[recenterField] = null;
    }
    if (this[debounceField]) {
      clearTimeout(this[debounceField]!);
    }
    this[debounceField] = setTimeout(() => {
      const el = ref?.nativeElement;
      if (!el) {
        return;
      }
      const base = kind === 'hour' ? this.hours : this.minutes;
      const items = kind === 'hour' ? this.hourItems : this.minuteItems;
      const rawIndex = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, rawIndex));
      const value = base[((clamped % base.length) + base.length) % base.length];
      if (kind === 'hour') {
        this.draftHour = value;
      } else {
        this.draftMinute = value;
      }
      this.scrollWheelToIndex(ref, clamped);
      this.scheduleRecenter(kind, ref, clamped);
    }, 120);
  }

  confirm(): void {
    if (!this.draftDate) {
      return;
    }
    this.date = this.draftDate;
    this.time = `${this.pad(this.draftHour)}:${this.pad(this.draftMinute)}`;
    this.dateChange.emit(this.date);
    this.timeChange.emit(this.time);
    this.open = false;
  }

  pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private scrollWheelsToSelection(): void {
    const hourMidStart = Math.floor(WHEEL_REPEAT / 2) * this.hours.length;
    const minuteMidStart = Math.floor(WHEEL_REPEAT / 2) * this.minutes.length;
    this.scrollWheelToIndex(this.hourWheelRef, hourMidStart + this.hours.indexOf(this.draftHour), false);
    this.scrollWheelToIndex(this.minuteWheelRef, minuteMidStart + this.minutes.indexOf(this.draftMinute), false);
  }

  /** Finds the occurrence of `value` (across all repeated copies) closest to `aroundIndex`. */
  private nearestIndexForValue(base: number[], value: number, aroundIndex: number): number {
    const valueIdx = base.indexOf(value);
    if (valueIdx < 0) {
      return Math.max(0, aroundIndex);
    }
    let best = valueIdx;
    let bestDist = Infinity;
    for (let copy = 0; copy < WHEEL_REPEAT; copy++) {
      const idx = copy * base.length + valueIdx;
      const dist = Math.abs(idx - aroundIndex);
      if (dist < bestDist) {
        bestDist = dist;
        best = idx;
      }
    }
    return best;
  }

  /** Once the wheel settles near either end of the repeated list, silently jumps back to the
   *  equivalent row in the middle copy so scrolling can continue to feel infinite. */
  private scheduleRecenter(
    kind: 'hour' | 'minute',
    ref: ElementRef<HTMLDivElement> | undefined,
    index: number,
  ): void {
    const base = kind === 'hour' ? this.hours : this.minutes;
    const len = base.length;
    const nearStart = index < len;
    const nearEnd = index >= len * (WHEEL_REPEAT - 1);
    if (!nearStart && !nearEnd) {
      return;
    }
    const recenterField = kind === 'hour' ? 'hourRecenterTimer' : 'minuteRecenterTimer';
    const midStart = Math.floor(WHEEL_REPEAT / 2) * len;
    const recenterIndex = midStart + (((index % len) + len) % len);
    this[recenterField] = setTimeout(() => {
      this.scrollWheelToIndex(ref, recenterIndex, false);
    }, 260);
  }

  private scrollWheelToIndex(
    ref: ElementRef<HTMLDivElement> | undefined,
    index: number,
    smooth = true,
  ): void {
    const el = ref?.nativeElement;
    if (!el || index < 0) {
      return;
    }
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
  }

  private syncDraftFromInputs(): void {
    this.draftDate = this.date || '';
    if (this.time) {
      const [h, m] = this.time.split(':').map((v) => parseInt(v, 10));
      this.draftHour = Number.isFinite(h) ? h : 17;
      this.draftMinute = this.nearestMinuteStep(Number.isFinite(m) ? m : 0);
    }
  }

  private nearestMinuteStep(m: number): number {
    const rounded = Math.round(m / 5) * 5;
    return Math.max(0, Math.min(55, rounded));
  }

  private buildCalendarDays(): void {
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.viewYear, this.viewMonth, 0).getDate();
    const today = this.todayIso();
    const min = this.effectiveMinDate;

    const days: CalendarDay[] = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const { y, m } = this.shiftMonth(this.viewYear, this.viewMonth, -1);
      const iso = this.toIso(y, m, dayNum);
      days.push({ iso, label: dayNum, inMonth: false, disabled: true, isToday: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = this.toIso(this.viewYear, this.viewMonth, d);
      days.push({
        iso,
        label: d,
        inMonth: true,
        disabled: iso < min,
        isToday: iso === today,
      });
    }

    const remainder = days.length % 7;
    if (remainder !== 0) {
      const { y, m } = this.shiftMonth(this.viewYear, this.viewMonth, 1);
      for (let d = 1; d <= 7 - remainder; d++) {
        const iso = this.toIso(y, m, d);
        days.push({ iso, label: d, inMonth: false, disabled: true, isToday: false });
      }
    }

    this.calendarDays = days;
  }

  private shiftMonth(year: number, month: number, delta: number): { y: number; m: number } {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    return { y, m };
  }

  private toIso(year: number, month: number, day: number): string {
    return `${year}-${this.pad(month + 1)}-${this.pad(day)}`;
  }

  private parseIso(iso: string): [number, number, number] {
    const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
    return [y || new Date().getFullYear(), (m || 1) - 1, d || 1];
  }

  private todayIso(): string {
    const now = new Date();
    return this.toIso(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private formatDatePretty(iso: string): string {
    const [y, m, d] = this.parseIso(iso);
    const date = new Date(y, m, d);
    const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
    return `${weekday}, ${MONTH_NAMES[m].slice(0, 3)} ${d}`;
  }
}
