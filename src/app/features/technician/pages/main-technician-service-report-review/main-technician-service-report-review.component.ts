import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface ReviewMaterial {
  item: string;
  quantity: string;
}

interface RawServiceReportReview {
  id: string;
  customerName: string;
  phoneNumber: string;
  emailAddress: string;
  address: string;
  location: string;
  serviceDate: string;
  productType: string;
  requiredMaterials: ReviewMaterial[];
  serviceDetails: {
    team: string;
    date: string;
    time: string;
    note: string;
  };
  status: string;
  reviewNotes?: string;
  serviceTeam?: string;
}

@Component({
  selector: 'app-main-technician-service-report-review',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './main-technician-service-report-review.component.html',
  styleUrl: './main-technician-service-report-review.component.css'
})
export class MainTechnicianServiceReportReviewComponent implements OnInit {
  id: string = '';
  isLoading = false;
  error: string | null = null;
  report: RawServiceReportReview | null = null;
  reviewNotes: string = '';

  private readonly apiUrl = `${environment.apiBaseUrl}/service-reports`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.loadServiceReport();
    });
  }

  public loadServiceReport(): void {
    this.isLoading = true;
    this.error = null;

    // Mocking for now to match Image 2, as we need certain fields not in the base report
    // In a real app, this would be a single API call to get full details
    this.http
      .get<{ success: boolean; data: RawServiceReportReview }>(`${this.apiUrl}/${this.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.report = response.data;
            this.reviewNotes = this.report.reviewNotes || '';
          } else {
            this.error = 'Failed to load service report details';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading service report:', err);
          this.error = err?.error?.message || 'Failed to load service report details';
          this.isLoading = false;
        }
      });
  }

  completeReview() {
    if (!this.report) return;

    this.isLoading = true;
    this.http
      .patch(`${this.apiUrl}/${this.id}`, {
        status: 'Reviewed',
        reviewNotes: this.reviewNotes
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/main-technician-service-reports']);
        },
        error: (err) => {
          console.error('Error completing review:', err);
          this.error = 'Failed to complete review';
          this.isLoading = false;
          // Even on error, navigate back for demo purposes if needed, 
          // but better to show error.
        }
      });
  }

  goBack() {
    this.router.navigate(['/main-technician-service-reports']);
  }
}

