import { Component, DestroyRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Required for *ngFor, ngClass, and pipes
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

interface RequirementMaterial {
  item: string;
  quantity: string;
}

interface RequirementLabour {
  technicians: number;
  helpers: number;
  duration: string;
}

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
  activeRequirementsTab: 'Materials' | 'Labour' = 'Materials';
  isLoading = false;
  error: string | null = null; // Fix: Property 'error' does not exist
  report: any = null;
  isSubmitting = false;
  
  // Review form states
  reviewNotes: string = ''; 
  financeNotes: string = '';
  rejectionReason = '';
  materials: RequirementMaterial[] = [];
  labourDetails: RequirementLabour = { technicians: 0, helpers: 0, duration: '' };
  editableMaterials: RequirementMaterial[] = [];
  editableLabour: RequirementLabour = { technicians: 0, helpers: 0, duration: '' };

  // Modal Visibility States
  showApproveModal = false;
  showRejectModal = false;
  showMakeChangesModal = false;

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
    const recommendedProducts = this.report?.inspectionMeta?.recommendedProducts;
    if (!Array.isArray(recommendedProducts) || recommendedProducts.length === 0) {
      return '-';
    }

    return recommendedProducts.join(', ');
  }

  private loadReviewReport(): void {
    this.isLoading = true;
    this.error = null;
    this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/${this.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.report = res.data;
          this.materials = res.data.requirements?.materials || [];
          this.labourDetails = res.data.requirements?.labour || { technicians: 0, helpers: 0, duration: '' };
          this.reviewNotes = res.data.reviewNotes || '';
          this.syncEditableRequirements();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load report details';
          this.isLoading = false;
        }
      });
  }

  // Modal Methods to fix "does not exist" errors
  openApproveModal() { this.showApproveModal = true; }
  closeApproveModal() { this.showApproveModal = false; }
  
  openRejectModal() {
    this.rejectionReason = this.reviewNotes || '';
    this.showRejectModal = true;
  }
  closeRejectModal() { this.showRejectModal = false; }
  
  openMakeChangesModal() {
    this.syncEditableRequirements();
    this.activeRequirementsTab = 'Materials';
    this.showMakeChangesModal = true;
  }
  closeMakeChangesModal() { this.showMakeChangesModal = false; }

  private syncEditableRequirements(): void {
    this.editableMaterials = this.materials.map(item => ({ ...item }));
    this.editableLabour = { ...this.labourDetails };
  }

  addMaterialRow(): void {
    this.editableMaterials = [...this.editableMaterials, { item: '', quantity: '' }];
  }

  removeMaterialRow(index: number): void {
    this.editableMaterials = this.editableMaterials.filter((_, currentIndex) => currentIndex !== index);
    if (this.editableMaterials.length === 0) {
      this.addMaterialRow();
    }
  }

  submitRequirements(): void {
    const requirements = {
      materials: this.editableMaterials
        .map(item => ({ item: item.item.trim(), quantity: item.quantity.trim() }))
        .filter(item => item.item && item.quantity),
      labour: {
        technicians: Number(this.editableLabour.technicians) || 0,
        helpers: Number(this.editableLabour.helpers) || 0,
        duration: this.editableLabour.duration.trim()
      }
    };

    this.isSubmitting = true;
    this.http.patch(`${this.apiUrl}/${this.id}/requirements`, {
      requirements,
      reviewNotes: this.reviewNotes
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.materials = requirements.materials;
          this.labourDetails = requirements.labour;
          this.showMakeChangesModal = false;
          this.isSubmitting = false;
          this.router.navigate(['/main-technician-inspection-reports']);
        },
        error: () => {
          this.error = 'Failed to update requirements';
          this.isSubmitting = false;
        }
      });
  }

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

  submitApproval() {
    this.isSubmitting = true;
    this.http.patch(`${this.apiUrl}/${this.id}/approve`, { financeNotes: this.financeNotes })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeApproveModal();
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

