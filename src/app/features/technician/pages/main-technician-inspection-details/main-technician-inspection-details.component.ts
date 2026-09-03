import { Component, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-main-technician-inspection-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-technician-inspection-details.component.html',
  styleUrl: './main-technician-inspection-details.component.css'})
export class MainTechnicianInspectionDetailsComponent implements OnInit {
  jobId: string | null = null;
  isLoading = false;
  error: string | null = null;
  
  inspectionData: any = null;
  inspectionDate: string | Date | null = null;

  private readonly apiUrl = `${environment.apiBaseUrl}/inspections`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.jobId = params['id'] || null;
      if (this.jobId) {
        this.loadInspection();
      }
    });
  }

  loadInspection(): void {
    if (!this.jobId) return;
    
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{ success: boolean; data: any }>(`${this.apiUrl}/${encodeURIComponent(this.jobId)}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.inspectionData = response.data;
            this.inspectionDate = this.extractInspectionDate(response.data);
          } else {
            this.error = 'Failed to load inspection details';
            this.inspectionDate = null;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading inspection:', err);
          this.error = `Failed to load inspection: ${err.message || 'Unknown error'}`;
          this.inspectionDate = null;
          this.isLoading = false;
        },
      });
  }

  private extractInspectionDate(data: any): string | Date | null {
    if (!data) {
      return null;
    }

    return data.date || data.serviceDate || data.inspectionDate || data.inspectionMeta?.date || null;
  }
}
