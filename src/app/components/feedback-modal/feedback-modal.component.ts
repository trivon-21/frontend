import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';

interface RatingCategory {
  key: 'productQuality' | 'technicianBehavior' | 'serviceQuality' | 'deliveryExperience';
  label: string;
  value: number;
}

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-modal.component.html',
  styleUrl: './feedback-modal.component.css',
})
export class FeedbackModalComponent {
  @Output() closed = new EventEmitter<void>();

  feedbackFor = '';
  referenceLabel = '';
  comment = '';

  submitted = false;
  submitting = false;
  error: string | null = null;

  readonly feedbackCategories = ['Order', 'Installation', 'Service', 'AMC Service Visit'];

  ratings: RatingCategory[] = [
    { key: 'productQuality',      label: 'Product Quality',      value: 0 },
    { key: 'technicianBehavior',  label: 'Technician Behaviour', value: 0 },
    { key: 'serviceQuality',      label: 'Service Quality',       value: 0 },
    { key: 'deliveryExperience',  label: 'Delivery Experience',   value: 0 },
  ];

  hoverStates: Record<string, number> = {};

  constructor(private feedbackService: FeedbackService) {}

  close() { this.closed.emit(); }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  setRating(key: string, value: number) {
    const cat = this.ratings.find(r => r.key === key);
    if (cat) cat.value = value;
  }

  setHover(key: string, value: number) { this.hoverStates[key] = value; }
  clearHover(key: string) { delete this.hoverStates[key]; }

  getDisplayRating(key: string, currentValue: number): number {
    return this.hoverStates[key] ?? currentValue;
  }

  get avgRating(): number {
    const rated = this.ratings.filter(r => r.value > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + r.value, 0) / rated.length;
  }

  get hasAnyRating(): boolean {
    return this.ratings.some(r => r.value > 0);
  }

  getStarLabel(value: number): string {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[value] || '';
  }

  submit() {
    if (!this.feedbackFor) { this.error = 'Please select what you are giving feedback for.'; return; }
    if (!this.hasAnyRating) { this.error = 'Please provide at least one rating.'; return; }
    this.error = null;
    this.submitting = true;

    const payload: any = {
      feedbackFor: this.feedbackFor,
      referenceLabel: this.referenceLabel,
      comment: this.comment,
    };
    this.ratings.forEach(r => {
      if (r.value > 0) payload[r.key] = r.value;
    });

    this.feedbackService.createFeedback(payload).subscribe({
      next: () => { this.submitted = true; this.submitting = false; },
      error: (err) => { this.error = err.error?.message || 'Failed to submit feedback.'; this.submitting = false; }
    });
  }

  resetForm() {
    this.submitted = false;
    this.feedbackFor = '';
    this.referenceLabel = '';
    this.comment = '';
    this.error = null;
    this.ratings.forEach(r => r.value = 0);
    this.hoverStates = {};
  }

  stars = [1, 2, 3, 4, 5];
}
