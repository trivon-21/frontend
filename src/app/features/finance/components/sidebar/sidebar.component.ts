import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  isOpen?: boolean;
}

interface NavSection {
  title: string;
  icon: string;
  isOpen: boolean;
  items: NavItem[];
}

interface StandaloneLink {
  title: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent {
  constructor(
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router
  ) { }

  standaloneLinks: StandaloneLink[] = [
    { title: 'Payment Dashboard', icon: 'dashboard', route: '/finance/dashboard' },
    { title: 'Payment Audit Log', icon: 'audit', route: '/finance/payment-audit-log' },
    { title: 'Financial Reports', icon: 'report', route: '/finance/financial-report' },
  ];

  sections: NavSection[] = [
    {
      title: 'Buy Only',
      icon: 'buyonly',
      isOpen: false,
      items: [
        { label: 'Payment Verification', icon: 'verification', route: '/finance/payment-verification' },
        { label: 'Verified Payments', icon: 'verified', route: '/finance/verified-payments' },
        { label: 'Rejected Payments', icon: 'rejected', route: '/finance/rejected-payments' },
      ]
    },
    {
      title: 'Inspection',
      icon: 'inspection',
      isOpen: false,
      items: [
        { label: 'Payment Verification', icon: 'verification', route: '/finance/inspection-payment-verification' },
        { label: 'Verified Payments', icon: 'verified', route: '/finance/inspection-verified-payments' },
        { label: 'Rejected Payments', icon: 'rejected', route: '/finance/inspection-rejected-payments' },
      ]
    },
    {
      title: 'Invoice Payment',
      icon: 'invoicepayment',
      isOpen: false,
      items: [
        { label: 'Payment Verification', icon: 'verification', route: '/finance/invoice/payment-verification' },
        { label: 'Verified Payments', icon: 'verified', route: '/finance/invoice/verified-payments' },
        { label: 'Rejected Payments', icon: 'rejected', route: '/finance/invoice/rejected-payments' },
      ]
    },
    {
      title: 'Invoice',
      icon: 'invoice',
      isOpen: false,
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/finance/invoice/dashboard' },
        { label: 'Generate Invoice', icon: 'verification', route: '/finance/invoice/generate' },
        { label: 'Pending Invoices', icon: 'verification', route: '/finance/invoice/pending' },
        { label: 'Accepted Invoices', icon: 'verified', route: '/finance/invoice/accepted' },
        { label: 'Rejected Invoices', icon: 'rejected', route: '/finance/invoice/rejected' },
        { label: 'Paid Invoices', icon: 'verified', route: '/finance/invoice/paid' },
        { label: 'Auto Cancelled', icon: 'rejected', route: '/finance/invoice/auto-cancelled' },
      ]
    },
    {
      title: 'Services',
      icon: 'services',
      isOpen: false,
      items: [
        {
          label: 'Repair',
          icon: 'repair',
          isOpen: false,
          children: [
            { label: 'Payment Verification', icon: 'verification', route: '/finance/services/repair-verification' },
            { label: 'Verified Payments', icon: 'verified', route: '/finance/services/repair-verified' },
            { label: 'Rejected Payments', icon: 'rejected', route: '/finance/services/repair-rejected' },
          ]
        },
        {
          label: 'Maintenance',
          icon: 'maintenance',
          isOpen: false,
          children: [
            { label: 'Payment Verification', icon: 'verification', route: '/finance/services/maintenance-verification' },
            { label: 'Verified Payments', icon: 'verified', route: '/finance/services/maintenance-verified' },
            { label: 'Rejected Payments', icon: 'rejected', route: '/finance/services/maintenance-rejected' },
          ]
        },
      ]
    },
    {
      title: 'Purchase Requests',
      icon: 'purchase',
      isOpen: false,
      items: [
        { label: 'Pending Requests',  icon: 'verification', route: '/finance/purchase-requests/pending' },
        { label: 'Approved Requests', icon: 'verified',     route: '/finance/purchase-requests/approved' },
        { label: 'Rejected Requests', icon: 'rejected',     route: '/finance/purchase-requests/rejected' },
      ]
    },
  ];

  // Toggle a sub-item (Repair/Maintenance) — closes any other open sibling first
  toggleItem(item: NavItem) {
    const wasOpen = item.isOpen;
    // Close every sibling sub-item in the same parent section
    this.sections.forEach(section => {
      section.items.forEach(i => {
        if (i.children && i !== item) i.isOpen = false;
      });
    });
    item.isOpen = !wasOpen;
  }

  // Toggle a top-level section — closes any other open section first
  toggleSection(section: NavSection) {
    const wasOpen = section.isOpen;
    this.sections.forEach(s => {
      if (s !== section) {
        s.isOpen = false;
        // also close any nested sub-items inside sections being collapsed
        s.items.forEach(i => { if (i.children) i.isOpen = false; });
      }
    });
    section.isOpen = !wasOpen;
  }

  getIcon(iconName: string): SafeHtml {
    const icons: { [key: string]: string } = {
      dashboard: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>`,
      verification: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>`,
      verified: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
      rejected: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
      buyonly: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>`,
      inspection: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>`,
      invoice: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>`,
      invoicepayment: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>`,
      chevron: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>`,
      services: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>`,
      repair: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>`,
      maintenance: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
      </svg>`,
      audit: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>`,
      report: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>`,
      purchase: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
      </svg>`,
    };
    return this.sanitizer.bypassSecurityTrustHtml(icons[iconName] || '');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}