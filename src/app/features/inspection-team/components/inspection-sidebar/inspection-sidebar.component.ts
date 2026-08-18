import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-inspection-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './inspection-sidebar.component.html',
  styleUrls: ['./inspection-sidebar.component.css']
})
export class InspectionSidebarComponent {
  constructor(private sanitizer: DomSanitizer) { }

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/inspection-officer/dashboard' },
    { label: 'Scheduled Inspections', icon: 'scheduled', route: '/inspection-officer/scheduled-inspections' },
    { label: 'Ongoing Inspections', icon: 'scheduled', route: '/inspection-officer/ongoing-inspections' },
    { label: 'Completed Inspections', icon: 'completed', route: '/inspection-officer/completed-inspections' },
  ];

  getIcon(iconName: string): SafeHtml {
    const icons: { [key: string]: string } = {
      dashboard: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>`,
      verification: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`,
      scheduled: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>`,
      completed: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>`,
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[iconName] || '');
  }
}