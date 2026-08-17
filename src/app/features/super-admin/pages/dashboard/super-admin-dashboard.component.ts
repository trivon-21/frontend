import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminDashboardSummary, SuperAdminService } from '../../services/super-admin.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css'],
})
export class SuperAdminDashboardComponent {
  data: SuperAdminDashboardSummary | null = null;
  loading = true;
  error: string | null = null;

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit(): void {
    this.superAdminService.getDashboardSummary().subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard summary';
        this.loading = false;
      }
    });
  }
}
