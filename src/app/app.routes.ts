import { Routes } from '@angular/router';
import { MainTechnicianMaintenanceDetailsComponent } from './features/technician/pages/main-technician-maintenance-details/main-technician-maintenance-details.component';
import { LayoutComponent as TechnicianLayoutComponent } from './features/technician/components/layout/layout.component';
import { LayoutComponent as ServiceTeamLayoutComponent } from './features/service-team/components/layout/layout.component';
import { MainTechnicianDashboardComponent } from './features/technician/pages/main-technician-dashboard/main-technician-dashboard.component';
import { MainTechnicianInspectionDetailsComponent } from './features/technician/pages/main-technician-inspection-details/main-technician-inspection-details.component';
import { MainTechnicianInspectionReportsComponent } from './features/technician/pages/main-technician-inspection-report/main-technician-inspection-report.component';
import { MainTechnicianInspectionReportReviewComponent } from './features/technician/pages/main-technician-inspection-report-review/main-technician-inspection-report-review.component';
import { MainTechnicianInstallationsComponent } from './features/technician/pages/main-technician-installations/main-technician-installations.component';
import { MainTechnicianInstallationDetailsComponent } from './features/technician/pages/main-technician-installation-details/main-technician-installation-details.component';
import { MainTechnicianServiceRequestsComponent } from './features/technician/pages/main-technician-service-requests/main-technician-service-requests.component';
import { MainTechnicianServiceRequestDetailsComponent } from './features/technician/pages/main-technician-service-request-details/main-technician-service-request-details.component';
import { MainTechnicianTeamManagementComponent } from './features/technician/pages/main-technician-team-management/main-technician-team-management.component';
import { MainTechnicianMaterialsComponent } from './features/technician/pages/main-technician-materials/main-technician-materials.component';
import { MainTechnicianInspectionsComponent } from './features/technician/pages/main-technician-inspections/main-technician-inspections.component';
import { MainTechnicianServiceHistoryComponent } from './features/technician/pages/main-technician-service-history/main-technician-service-history.component';
import { MainTechnicianServiceReportsComponent } from './features/technician/pages/main-technician-service-report/main-technician-service-report.component';
import { MainTechnicianServiceReportReviewComponent } from './features/technician/pages/main-technician-service-report-review/main-technician-service-report-review.component';
import { MainTechnicianMaintenanceComponent } from './features/technician/pages/main-technician-maintenance/main-technician-maintenance.component';
import { MainTechnicianMaintenanceSchedulingComponent } from './features/technician/pages/main-technician-maintenance-scheduling/main-technician-maintenance-scheduling.component';
import { ServiceTeamDashboardComponent } from './features/service-team/pages/service-team-dashboard/service-team-dashboard.component';
import { ServiceTeamAssignedJobsComponent } from './features/service-team/pages/service-team-assigned-jobs/service-team-assigned-jobs.component';
import { ServiceTeamTeamDetailsComponent } from './features/service-team/pages/service-team-team-details/service-team-team-details.component';
import { ServiceTeamServiceDetailsComponent } from './features/service-team/pages/service-team-service-details/service-team-service-details.component';
import { ServiceTeamServiceHistoryComponent } from './features/service-team/pages/service-team-service-history/service-team-service-history.component';
import { LandingPage } from './shared/pages/landing-page/landing-page';
import { LoginPage } from './shared/pages/login-page/login-page';

export const routes: Routes = [
  { path: '', component: LandingPage, pathMatch: 'full' },
  { path: 'login', component: LoginPage, pathMatch: 'full' },

  // ── Technician / Manager portal
  {
    path: '',
    component: TechnicianLayoutComponent,
    children: [
      { path: 'main-technician-dashboard', component: MainTechnicianDashboardComponent },
      { path: 'main-technician-inspections', component: MainTechnicianInspectionsComponent },
      { path: 'main-technician-inspection-report-review/:id', component: MainTechnicianInspectionReportReviewComponent },
      { path: 'main-technician-inspection-reports', component: MainTechnicianInspectionReportsComponent },
      { path: 'main-technician-inspection-details/:id', component: MainTechnicianInspectionDetailsComponent },
      { path: 'main-technician-installations', component: MainTechnicianInstallationsComponent },
      { path: 'main-technician-installation-details/:id', component: MainTechnicianInstallationDetailsComponent },
      { path: 'main-technician-service-requests', component: MainTechnicianServiceRequestsComponent },
      { path: 'main-technician-service-request-details/:id', component: MainTechnicianServiceRequestDetailsComponent },
      { path: 'main-technician-service-history/:source/:id', component: MainTechnicianServiceHistoryComponent },
      { path: 'main-technician-service-history/:id', component: MainTechnicianServiceHistoryComponent },
      { path: 'main-technician-team-management', component: MainTechnicianTeamManagementComponent },
      { path: 'main-technician-maintenance', component: MainTechnicianMaintenanceComponent },
      { path: 'main-technician-maintenance-details/:id', component: MainTechnicianMaintenanceDetailsComponent },
      { path: 'main-technician-maintenance-scheduling', component: MainTechnicianMaintenanceSchedulingComponent },
      { path: 'main-technician-materials', component: MainTechnicianMaterialsComponent },
      { path: 'main-technician-service-reports', component: MainTechnicianServiceReportsComponent },
      { path: 'main-technician-service-report-review/:id', component: MainTechnicianServiceReportReviewComponent },
    ]
  },

  // ── Service Team portal
  {
    path: 'service-team',
    component: ServiceTeamLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ServiceTeamDashboardComponent },
      { path: 'assigned-jobs', component: ServiceTeamAssignedJobsComponent },
      { path: 'team-details', component: ServiceTeamTeamDetailsComponent },
      { path: 'service-details/:id', component: ServiceTeamServiceDetailsComponent },
      { path: 'service-history/:id', component: ServiceTeamServiceHistoryComponent }
    ]
  },

  // ── Backward compatibility redirects
  { path: 'service-dashboard',          redirectTo: 'service-team/dashboard',     pathMatch: 'full' },
  { path: 'service-team-dashboard',     redirectTo: 'service-team/dashboard',     pathMatch: 'full' },
  { path: 'service-team-assigned-jobs', redirectTo: 'service-team/assigned-jobs', pathMatch: 'full' },
  { path: 'service-team-team-details',  redirectTo: 'service-team/team-details',  pathMatch: 'full' },
];
