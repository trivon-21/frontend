import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SuperAdminService } from '../../features/super-admin/services/super-admin.service';

@Component({
  selector: 'app-reactivation-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reactivation-request.component.html',
  styleUrls: ['./reactivation-request.component.css'],
})
export class ReactivationRequestComponent implements OnInit {
  email: string = '';
  userReason: string = '';
  loading = false;
  submitted = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private superAdminService: SuperAdminService
  ) {}

  ngOnInit(): void {
    // Get email from query params
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  submitRequest(): void {
    // Validate
    if (!this.email || !this.userReason.trim()) {
      this.error = 'Please provide both email and reason';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.superAdminService.submitReactivationRequest(this.email, this.userReason).subscribe({
      next: (response) => {
        this.loading = false;
        this.submitted = true;
        this.success = 'Your reactivation request has been submitted successfully. Our team will review it and contact you soon.';
        this.userReason = '';

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to submit reactivation request';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
