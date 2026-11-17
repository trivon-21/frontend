import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SuperAdminDashboardSummary, SuperAdminService } from '../../services/super-admin.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PortalIconsModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css'],
})
export class SuperAdminDashboardComponent implements OnInit {
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
