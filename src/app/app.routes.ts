import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
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

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'main-technician-dashboard', pathMatch: 'full' },
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
      { path: 'main-technician-materials', component: MainTechnicianMaterialsComponent },
      { path: 'main-technician-service-reports', component: MainTechnicianServiceReportsComponent },
      { path: 'main-technician-service-report-review/:id', component: MainTechnicianServiceReportReviewComponent },
    ]
  }
];
