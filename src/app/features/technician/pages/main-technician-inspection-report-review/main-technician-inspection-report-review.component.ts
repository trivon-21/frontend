import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Required for *ngFor, ngClass, and pipes
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-main-technician-inspection-report-review',
  standalone: true,
  // Added FormsModule and CommonModule to fix template errors
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  providers: [DatePipe],
  templateUrl: './main-technician-inspection-report-review.component.html',
  styleUrl: './main-technician-inspection-report-review.component.css'
})
export class MainTechnicianInspectionReportReviewComponent implements OnInit {
  id: string = '';
  activeTab: string = 'Overview';
  isLoading = false;
  error: string | null = null; // Fix: Property 'error' does not exist
  report: any = null;
  isSubmitting = false;
  
  // Review form states
  recommendedProduct: string = '';
  reviewNotes: string = ''; 
  rejectionReason = '';

  // Modal Visibility States
  showRejectModal = false;

  private readonly apiUrl = `${environment.apiBaseUrl}/inspections-reports`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.loadReviewReport();
      }
    });
  }

  get recommendedProductType(): string {
    if (this.recommendedProduct.trim()) {
      return this.recommendedProduct.trim();
    }
    return '-';
  }

  private loadReviewReport(): void {
    this.isLoading = true;
    this.error = null;
    this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/${this.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.report = res.data;
          this.recommendedProduct = '';
          this.reviewNotes = res.data.reviewNotes || '';
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load report details';
          this.isLoading = false;
        }
      });
  }

  openRejectModal() {
    this.rejectionReason = this.reviewNotes || '';
    this.showRejectModal = true;
  }
  closeRejectModal() { this.showRejectModal = false; }

  submitRejection(): void {
    if (!this.rejectionReason.trim()) {
      this.error = 'Please enter a rejection reason';
      return;
    }

    this.isSubmitting = true;
    this.http.patch(`${this.apiUrl}/${this.id}/reject`, {
      rejectionReason: this.rejectionReason.trim()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showRejectModal = false;
          this.isSubmitting = false;
          this.router.navigate(['/main-technician-inspection-reports']);
        },
        error: () => {
          this.error = 'Failed to reject report';
          this.isSubmitting = false;
        }
      });
  }

  completeReview() {
    if (!this.recommendedProduct.trim()) {
      this.error = 'Please add a recommended product before completing review.';
      return;
    }

    this.error = null;
    this.isSubmitting = true;
    this.http.patch(`${this.apiUrl}/${this.id}/approve`, {
      financeNotes: this.reviewNotes.trim(),
      recommendedProduct: this.recommendedProduct.trim(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/main-technician-inspection-reports']);
        },
        error: () => {
          this.error = 'Failed to approve report';
          this.isSubmitting = false;
        }
      });
  }
}

